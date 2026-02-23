import pLimit from 'p-limit'
import { promises as fs } from 'fs'
import path from 'path'
import { getBlockChildren, createPage, updatePageProperty, notionRequest } from './lib/notion.ts'
import type { NotionBlock, ProjectNotionPage, NotionQueryResponse } from './lib/types.ts'
import { notionToken } from './lib/constants.ts'

const LOG_TAG = 'preprocess-notion-projects'
const PROJECTS_DATABASE_ID = process.env.NOTION_PROJECTS_DATABASE_ID
const ROOT_PROJECTS_PAGE_ID = 'e645a6deba8c4b5e945b1f25cec44710'
const COMPLETED_PROJECTS_PAGE_ID = '1aa402b843138097a3d7f1f38e642139'
const PROJECT_INTRO_TITLE = '프로젝트 소개'

type ProjectStatus = 'in-progress' | 'completed'

interface TeamMember {
  name: string
  pastProjects: string[]
}

interface ParsedProjectData {
  name: string
  status: ProjectStatus
  summary: string
  description: string
  goal: string
  github: string
  demo: string
  techStacks: string[]
  participants: string[]
  date: { start: string; end?: string } | null
  thumbnailUrl?: string | null
  screenshotsUrls?: string[]
}

interface ExistingProjectData {
  id: string
  thumbnailUrl: string | null
  screenshotsInfoText: string | null
}

/**
 * 지정된 노션 프로젝트 데이터베이스에서 모든 프로젝트 항목을 조회합니다.
 * 이 함수는 추후 생성, 갱신(Upsert) 작업 시 기존에 등록된 페이지 ID나 영구 URL 정보가
 * 덮어씌워지지 않도록 비교·매핑하기 위한 기초 데이터 맵을 생성하는 데 활용됩니다.
 *
 * @returns {Promise<Map<string, ExistingProjectData>>}
 * - 키(Key): 소문자로 변환된 프로젝트 이름
 * - 값(Value): 노션 페이지 ID, 기존 썸네일 URL, 스크린샷 텍스트 정보를 포함하는 객체
 * @throws {Error} 환경 변수(NOTION_PROJECTS_DATABASE_ID)가 누락된 경우 에러 발생
 */
async function fetchAllDatabaseItems(): Promise<Map<string, ExistingProjectData>> {
  const nameToDataMap = new Map<string, ExistingProjectData>()
  let startCursor: string | undefined = undefined

  if (!PROJECTS_DATABASE_ID) throw new Error('NOTION_PROJECTS_DATABASE_ID is required')

  while (true) {
    const response: NotionQueryResponse<ProjectNotionPage> = await notionRequest<ProjectNotionPage>(
      `/databases/${PROJECTS_DATABASE_ID}/query`,
      {
        page_size: 100,
        start_cursor: startCursor,
      },
      LOG_TAG
    )

    for (const page of response.results) {
      const titleProperty = page.properties.Name
      if (titleProperty?.title?.[0]?.plain_text) {
        const projectName = titleProperty.title[0].plain_text.trim()

        const thumbProp = page.properties.thumbnail_url
        const thumbUrl =
          thumbProp?.type === 'url'
            ? thumbProp.url
            : thumbProp?.type === 'rich_text'
              ? thumbProp.rich_text?.[0]?.plain_text
              : null

        const screenshotsProp = page.properties.screenshots_info
        const screenshotsText =
          screenshotsProp?.type === 'rich_text'
            ? screenshotsProp.rich_text
                ?.map((t: { plain_text?: string }) => t.plain_text || '')
                .join('')
            : null

        nameToDataMap.set(projectName.toLowerCase(), {
          id: page.id,
          thumbnailUrl: thumbUrl || null,
          screenshotsInfoText: screenshotsText || null,
        })
      }
    }

    if (!response.has_more || !response.next_cursor) break
    startCursor = response.next_cursor
  }

  return nameToDataMap
}

/**
 * 부모 블록(또는 페이지) ID를 기반으로, 해당 노드의 모든 하위 블록을 재귀적으로 조회하여 반환합니다.
 * 노션 API의 페이지네이션(start_cursor)을 내부적으로 처리하여 누락 없이 모든 블록을 수집합니다.
 *
 * @param {string} blockId - 하위 블록을 조회할 부모의 노션 블록 또는 페이지 ID
 * @returns {Promise<NotionBlock[]>} 확보한 전체 하위 노션 블록 배열
 */
async function fetchAllBlocks(blockId: string): Promise<NotionBlock[]> {
  const allBlocks: NotionBlock[] = []
  let startCursor: string | undefined = undefined

  while (true) {
    const response = await getBlockChildren(blockId, LOG_TAG, startCursor)
    allBlocks.push(...response.results)
    if (!response.has_more || !response.next_cursor) break
    startCursor = response.next_cursor
  }

  return allBlocks
}

/**
 * 노션 하위 블록 객체들의 배열을 순회하여 프로젝트에 필요한 상세 데이터 추출(파싱)을 수행합니다.
 * 제목(`heading_3`)을 기준으로 현재 필드의 역할('summary', 'description', 'thumbnail' 등)을
 * 판별한 후, 그 아래에 딸린 문단(`paragraph`)이나 이미지(`image`) 등을 조합해 데이터를 구성합니다.
 *
 * @param {NotionBlock[]} blocks - 파싱할 노션의 하위 블록 객체 배열
 * @returns {Promise<Partial<ParsedProjectData>>} 파싱이 완료된 프로젝트 데이터 객체(일부 속성 생략 가능)
 */
async function parseBlocks(blocks: NotionBlock[]): Promise<Partial<ParsedProjectData>> {
  const data: Partial<ParsedProjectData> = {}
  // 블록 컨텐츠 기반으로 파싱하는 정보가 아닌 것을 제외 (프로젝트 이름, 상태, 참여자)
  // name은 프로젝트 페이지 명, status는 상위 페이지의 id에 따라 구분, participants는 team.generated.json 파일에서 가져옴
  let currentField: Exclude<keyof ParsedProjectData, 'name' | 'status' | 'participants'> | null =
    null
  let currentTextContent: string[] = []

  const saveCurrentField = () => {
    if (!currentField) return

    if (currentField === 'thumbnailUrl' || currentField === 'screenshotsUrls') {
      // These fields are populated directly within the loop
      return
    }

    const text = currentTextContent.join('\n').trim()

    if (currentField === 'date') {
      // expected format: "2024.01 - 2024.06" or "2024.01"
      const parts = text.split('-').map((p) => p.trim())

      const formatDate = (dateStr: string) => {
        let formatted = dateStr.replace(/\./g, '-')
        // if date is "YYYY-MM", append "-01" to make it "YYYY-MM-DD"
        if (/^\d{4}-\d{2}$/.test(formatted)) {
          formatted = `${formatted}-01`
        }
        return formatted
      }

      if (parts.length > 0 && parts[0]) {
        if (parts.length === 2 && parts[1]) {
          data.date = {
            start: formatDate(parts[0]),
            end: formatDate(parts[1]),
          }
        } else {
          data.date = { start: formatDate(parts[0]) }
        }
      }
    } else if (currentField === 'techStacks') {
      data.techStacks = currentTextContent
        .join(',')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } else if (currentField === 'github' || currentField === 'demo') {
      if (text !== '-' && text.length > 0) {
        data[currentField] = text
      }
    } else {
      ;(data as Record<string, unknown>)[currentField] = text
    }
  }

  for (const block of blocks) {
    if (block.type === 'heading_3' && block.heading_3) {
      saveCurrentField()
      const title = block.heading_3.rich_text
        .map((t) => t.plain_text)
        .join('')
        .trim()
        .toLowerCase()

      if (title === 'period' || title === 'date') currentField = 'date'
      else if (title === 'summary') currentField = 'summary'
      else if (title === 'description') currentField = 'description'
      else if (title === 'goal') currentField = 'goal'
      else if (title === 'tech stacks' || title === 'tech-stacks' || title === 'tech stack')
        currentField = 'techStacks'
      else if (title === 'github') currentField = 'github'
      else if (title === 'demo') currentField = 'demo'
      else if (title === 'thumbnail') currentField = 'thumbnailUrl'
      else if (title === 'screenshots') {
        currentField = 'screenshotsUrls'
        data.screenshotsUrls = []
      } else currentField = null

      currentTextContent = []
    } else if (currentField && block.type === 'paragraph' && block.paragraph) {
      const text = block.paragraph.rich_text.map((t) => t.plain_text).join('')
      if (text) currentTextContent.push(text)
    } else if (currentField && block.type === 'bulleted_list_item' && block.bulleted_list_item) {
      const text = block.bulleted_list_item.rich_text.map((t) => t.plain_text).join('')
      if (text) currentTextContent.push(text)
    } else if (currentField === 'thumbnailUrl' && block.type === 'image' && block.image) {
      const url = block.image.file?.url || block.image.external?.url
      if (url) data.thumbnailUrl = url
    } else if (currentField === 'screenshotsUrls' && block.type === 'column_list') {
      const columnsRes = await getBlockChildren(block.id, LOG_TAG)
      for (const col of columnsRes.results) {
        const colChildrenRes = await getBlockChildren(col.id, LOG_TAG)
        for (const child of colChildrenRes.results) {
          if (child.type === 'image' && child.image) {
            const url = child.image.file?.url || child.image.external?.url
            if (url) {
              if (!data.screenshotsUrls) data.screenshotsUrls = []
              data.screenshotsUrls.push(url)
            }
          }
        }
      }
    }
  }

  saveCurrentField()
  return data
}

/**
 * 특정 프로젝트 부모 페이지 ID를 전달받아, 하위에 존재하는 "프로젝트 소개" 페이지 블록을 찾고
 * 해당 블록 안의 내용을 `parseBlocks`를 통해 파싱합니다.
 *
 * @param {string} projectPageId - 최상위 개별 프로젝트 노션 페이지 ID
 * @returns {Promise<Partial<ParsedProjectData> | null>} 성공적으로 소개 페이지를 찾아 값을 파싱한 경우 데이터 반환, 찾지 못한 경우 null
 */
async function findProjectIntroAndParse(
  projectPageId: string
): Promise<Partial<ParsedProjectData> | null> {
  const blocks = await fetchAllBlocks(projectPageId)
  const introPageBlock = blocks.find(
    (b) => b.type === 'child_page' && b.child_page?.title === PROJECT_INTRO_TITLE
  )

  if (!introPageBlock) return null

  const introBlocks = await fetchAllBlocks(introPageBlock.id)
  return await parseBlocks(introBlocks)
}

/**
 * 팀 멤버 정보 목록(`teamData`)을 순회하며, 특정 `projectName`이 멤버의 과거 참여 프로젝트
 * (`pastProjects`) 목록에 포함되어 있는지 확인하여 현재 프로젝트의 참여 인원 배열을 반환합니다.
 * 결과는 Set 자료구조를 사용하여 팀원 이름의 중복을 방지합니다.
 *
 * @param {string} projectName - 조회할 대상 프로젝트의 이름
 * @param {TeamMember[]} teamData - 전체 팀원들의 정보(이름, 과거 프로젝트 등) 배열
 * @returns {string[]} 프로젝트에 참여한 팀원들의 이름 배열
 */
function findParticipantsFromName(projectName: string, teamData: TeamMember[]): string[] {
  const names = new Set<string>()

  for (const member of teamData) {
    if (member.pastProjects && member.pastProjects.includes(projectName)) {
      names.add(member.name)
    }
  }

  return Array.from(names)
}

/**
 * 주어진 이미지 URL이 노션의 임시 노출용 S3 URL(Presigned URL)인지
 * 아니면 내부 자체 영구 보관용(Permanent) URL인지 판별합니다.
 * 노션의 Presigned URL에는 보안 서명('X-Amz-Signature')이나 'prod-files-secure' 패턴이 포함됩니다.
 *
 * @param {string} url - 검증할 이미지 URL 문자열
 * @returns {boolean} 영구 URL인 경우 true, 노션의 임시/보안 URL인 경우 false
 */
function isPermanentUrl(url: string): boolean {
  if (!url) return false
  return !url.includes('X-Amz-Signature') && !url.includes('prod-files-secure')
}

/**
 * 추출 및 파싱된 프로젝트 데이터(`ParsedProjectData`)를 노션 데이터베이스 API 요청 양식에
 * 맞는 프로퍼티(Property) 페이로드 객체로 변환합니다.
 * 기존의 조회 데이터를 전달하면 영구 이미지 URL을 덮어씌지 않도록 방어 로직이 동작합니다.
 *
 * @param {ParsedProjectData} data - 블록에서 새롭게 추출/조립된 프로젝트 데이터
 * @param {ExistingProjectData} [existingProject] - 데이터베이스에 이미 저장되어 있는 기존 프로젝트 항목 (선택적)
 * @returns {Record<string, unknown>} 노션 API `properties` 업데이트 요청에 전달할 객체
 */
function buildNotionProperties(
  data: ParsedProjectData,
  existingProject?: ExistingProjectData
): Record<string, unknown> {
  const props: Record<string, unknown> = {
    Name: { title: [{ text: { content: data.name } }] },
    Status: { status: { name: data.status === 'in-progress' ? 'In progress' : 'Completed' } },
  }

  if (data.summary) props.summary = { rich_text: [{ text: { content: data.summary } }] }
  if (data.description) props.description = { rich_text: [{ text: { content: data.description } }] }
  if (data.goal) props.goal = { rich_text: [{ text: { content: data.goal } }] }
  if (data.github) props.github = { url: data.github }
  if (data.demo) props.demo = { url: data.demo }

  if (data.techStacks && data.techStacks.length > 0) {
    props['tech-stacks'] = { multi_select: data.techStacks.map((name) => ({ name })) }
  }

  if (data.participants && data.participants.length > 0) {
    props.participants = { rich_text: [{ text: { content: data.participants.join(', ') } }] }
  }

  if (data.date) {
    props.Date = {
      date: {
        start: data.date.start,
        end: data.status === 'in-progress' ? null : data.date.end || null,
      } as { start: string; end: string | null },
    }
  }

  if (data.thumbnailUrl) {
    const existingUrl = existingProject?.thumbnailUrl
    if (existingUrl && isPermanentUrl(existingUrl)) {
      // 이미 영구 링크가 있다면 파싱한 임시 URL로 덮어쓰지 않음
    } else {
      props.thumbnail_url = { url: data.thumbnailUrl }
    }
  }

  if (data.screenshotsUrls && data.screenshotsUrls.length > 0) {
    let hasPermanentScreenshots = false
    const existingScreenshotsText = existingProject?.screenshotsInfoText

    if (existingScreenshotsText) {
      try {
        const parsed = JSON.parse(existingScreenshotsText)
        if (parsed.length > 0 && parsed[0].src && isPermanentUrl(parsed[0].src)) {
          hasPermanentScreenshots = true
        }
      } catch {
        // parsing failed, assume not permanent
      }
    }

    if (!hasPermanentScreenshots) {
      const screenshotsJson = data.screenshotsUrls.map((url, i) => ({
        src: url,
        title: `Screenshot ${i + 1}`,
      }))

      // To bypass the 2000 chars limit per text block in Notion, we split the JSON array into individual item strings
      const jsonString = JSON.stringify(screenshotsJson)
      const chunks = []
      for (let i = 0; i < jsonString.length; i += 2000) {
        chunks.push({
          type: 'text',
          text: { content: jsonString.substring(i, i + 2000) },
        })
      }

      props.screenshots_info = { rich_text: chunks }
    }
  }

  return props
}

/**
 * 프로젝트 데이터 갱신의 전체 파이프라인(스크립트의 진입 과정)을 통제하고 지휘하는 메인 함수입니다.
 * 1. 기존 DB에 적재된 데이터를 불러옴
 * 2. 팀원 데이터를 `team.generated.json`에서 읽어 팀원 매핑 세팅을 캐싱
 * 3. 루트(진행중) 및 완료된 프로젝트 페이지들에서 데이터를 파싱하고 추출
 * 4. 최종적으로 생성된 프로젝트 데이터를 기존 정보들과 비교하며 DB 항목의 생성(Insert) 또는 변경(Update)을 수행
 *
 * @throws {Error} 필수 환경 변수가 누락되었을 경우 에러 발생
 * @returns {Promise<void>} 갱신 프로세스 완료 시 정상 종료
 */
async function processProjects() {
  if (!notionToken || !PROJECTS_DATABASE_ID) {
    throw new Error('Missing NOTION_TOKEN or NOTION_PROJECTS_DATABASE_ID')
  }

  console.log(`[${LOG_TAG}] Fetching existing DB items...`)
  const dbItemsMap = await fetchAllDatabaseItems()
  console.log(`[${LOG_TAG}] Found ${dbItemsMap.size} projects in DB`)

  // 프로젝트 참여 인원을 연동하기 위해서 반드시 `sync:team` 작업이 먼저 수행되어야 함
  const teamDataPath = path.resolve(process.cwd(), 'src/data/team.generated.json')
  let teamData: TeamMember[] = []
  try {
    const fileContent = await fs.readFile(teamDataPath, 'utf8')
    teamData = JSON.parse(fileContent)
    console.log(`[${LOG_TAG}] Loaded ${teamData.length} team members from team.generated.json`)
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      console.warn(
        `[${LOG_TAG}] Warning: src/data/team.generated.json not found. Participants mapper will be empty. (Make sure to run 'sync:team' first!)`
      )
    } else {
      throw err
    }
  }

  const parsedProjects: ParsedProjectData[] = []

  // 1. Root Page -> In-progress projects
  console.log(`[${LOG_TAG}] Fetching root page blocks...`)
  const rootBlocks = await fetchAllBlocks(ROOT_PROJECTS_PAGE_ID)
  let inProgressToggleId: string | null = null

  // Find toggle named "진행중인 프로젝트"
  for (const block of rootBlocks) {
    if (block.type === 'toggle' && block.toggle) {
      const text = block.toggle.rich_text.map((t) => t.plain_text).join('')
      if (text.includes('진행중인 프로젝트')) {
        inProgressToggleId = block.id
        break
      }
    }
  }

  const limit = pLimit(3)

  if (inProgressToggleId) {
    console.log(`[${LOG_TAG}] Parsing In-progress projects...`)
    const toggleBlocks = await fetchAllBlocks(inProgressToggleId)
    // Find all child pages
    const promises = toggleBlocks.map((block) => {
      return limit(async () => {
        if (block.type === 'child_page' && block.child_page) {
          const title = block.child_page.title
          const data = await findProjectIntroAndParse(block.id)
          const participants = findParticipantsFromName(title, teamData)
          if (data) {
            console.log(`[${LOG_TAG}] Parsed in-progress project: ${title}`)
            parsedProjects.push({
              ...data,
              participants,
              name: title,
              status: 'in-progress',
            } as ParsedProjectData)
          } else {
            console.warn(`[${LOG_TAG}]   -> No '${PROJECT_INTRO_TITLE}' found for ${title}`)
          }
        }
      })
    })
    await Promise.all(promises)
  }

  // 2. Completed Projects
  console.log(`[${LOG_TAG}] Parsing Completed projects...`)
  const completedBlocks = await fetchAllBlocks(COMPLETED_PROJECTS_PAGE_ID)
  const completedPromises = completedBlocks.map((block) => {
    return limit(async () => {
      if (block.type === 'child_page' && block.child_page) {
        const title = block.child_page.title
        const data = await findProjectIntroAndParse(block.id)
        const participants = findParticipantsFromName(title, teamData)
        if (data) {
          console.log(`[${LOG_TAG}] Parsed completed project: ${title}`)
          parsedProjects.push({
            ...data,
            participants,
            name: title,
            status: 'completed',
          } as ParsedProjectData)
        } else {
          console.warn(`[${LOG_TAG}]   -> No '${PROJECT_INTRO_TITLE}' found for ${title}`)
        }
      }
    })
  })
  await Promise.all(completedPromises)

  console.log(`\n[${LOG_TAG}] Starting Upsert... (${parsedProjects.length} items)`)
  const upsertPromises = parsedProjects.map((project) => {
    return limit(async () => {
      const existingProject = dbItemsMap.get(project.name.toLowerCase())
      const properties = buildNotionProperties(project, existingProject)

      try {
        if (existingProject) {
          console.log(`[${LOG_TAG}] UPSERT (Update): ${project.name}`)
          await updatePageProperty(existingProject.id, properties, LOG_TAG)
        } else {
          console.log(`[${LOG_TAG}] UPSERT (Insert): ${project.name}`)
          await createPage(PROJECTS_DATABASE_ID, properties, LOG_TAG)
        }
      } catch (e) {
        console.error(`[${LOG_TAG}] Failed to upsert ${project.name}:`, e)
      }
    })
  })

  await Promise.all(upsertPromises)

  console.log(`[${LOG_TAG}] Done preprocessing.`)
}

processProjects().catch((error: unknown) => {
  console.error(`[${LOG_TAG}] Main script failed:`, error)
  process.exit(1)
})
