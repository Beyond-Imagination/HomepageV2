import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, extname, join } from 'node:path'
import pLimit from 'p-limit'

const NOTION_BASE_URL = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'
const OUTPUT_JSON_PATH = 'src/data/team.generated.json'
const OUTPUT_PENDING_UPDATES_PATH = 'src/data/team.pending-link-updates.json'
const OUTPUT_IMAGE_DIR = 'public/images/team'
const OUTPUT_IMAGE_PUBLIC_BASE_PATH = '/images/team'
const IMAGE_WIDTH = 512
const IMAGE_QUALITY = 80
const CONCURRENT_LIMIT = 5
const NOTION_API_MAX_RETRIES = 3
const NOTION_API_RETRY_DELAY_MS = 500

const notionToken = process.env.NOTION_TOKEN
const notionDatabaseId = process.env.NOTION_TEAM_DATABASE_ID

const notionJoinDatePropertyName = '가입일'
const notionTeamLeadPropertyName = '팀장'
const notionProjectLeadPropertyName = '프로젝트장'
const notionProjectPropertyName = '프로젝트'
const notionPastProjectsPropertyName = '참여했던 프로젝트'
const notionLeaveDatePropertyName = '탈퇴일'
const notionBioPropertyName = '한 줄 소개'
const notionImagePropertyName = '프로필 사진'
const notionGitHubPropertyName = 'github'
const notionS3LinkPropertyName = 'S3 link'

type NotionFile = {
  type: 'external' | 'file'
  external?: { url: string }
  file?: { url: string }
}

type NotionProperty = {
  type: string
  files?: NotionFile[]
  title?: Array<{ plain_text?: string }>
  rich_text?: Array<{ plain_text?: string }>
  date?: { start?: string }
  checkbox?: boolean
  select?: { name?: string }
  multi_select?: Array<{ name?: string }>
  url?: string
  email?: string
}

type NotionPage = {
  id: string
  properties: Record<string, NotionProperty>
  cover?: NotionFile
}

type TeamMember = {
  id: number
  name: string
  role: string
  bio: string
  image: string
  pastProjects: string[]
  social: {
    github?: string
    website?: string
    email?: string
  }
  isTeamLead: boolean
  leaveDate: string | null
}

type PendingLinkUpdate = {
  pageId: string
  link: string
  propertyType: 'url' | 'rich_text'
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function notionRequest(path: string, body: Record<string, unknown>) {
  for (let attempt = 1; attempt <= NOTION_API_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(`${NOTION_BASE_URL}${path}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${notionToken}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        return (await response.json()) as {
          results: NotionPage[]
          has_more: boolean
          next_cursor: string | null
        }
      }

      const responseText = await response.text()
      const isRetryable = response.status === 429 || response.status >= 500
      if (!isRetryable || attempt === NOTION_API_MAX_RETRIES) {
        throw new Error(`Notion API request failed: ${response.status} ${responseText}`)
      }

      const retryAfterMs = NOTION_API_RETRY_DELAY_MS
      console.warn(
        `[sync-notion-team] Notion request retry ${attempt}/${NOTION_API_MAX_RETRIES} after ${retryAfterMs}ms: ${response.status}`
      )
      await sleep(retryAfterMs)
    } catch (error) {
      if (attempt === NOTION_API_MAX_RETRIES) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Notion API request failed after retries: ${message}`)
      }
      console.warn(
        `[sync-notion-team] Notion request network retry ${attempt}/${NOTION_API_MAX_RETRIES} after ${NOTION_API_RETRY_DELAY_MS}ms`
      )
      await sleep(NOTION_API_RETRY_DELAY_MS)
    }
  }
  throw new Error('Notion API request failed: retry loop terminated unexpectedly')
}

async function fetchDatabasePages() {
  const pages: NotionPage[] = []
  let startCursor: string | undefined = undefined

  while (true) {
    const data = await notionRequest(`/databases/${notionDatabaseId}/query`, {
      page_size: 100,
      start_cursor: startCursor,
      sorts: [{ property: notionJoinDatePropertyName, direction: 'ascending' }],
    })

    pages.push(...data.results)

    if (!data.has_more || !data.next_cursor) break
    startCursor = data.next_cursor
  }

  return pages
}

function pickPlainText(property: NotionProperty | undefined): string {
  if (!property) return ''
  if (property.rich_text && property.rich_text.length > 0) {
    return property.rich_text.map((t) => t.plain_text).join('')
  }
  if (property.title && property.title.length > 0) {
    return property.title.map((t) => t.plain_text).join('')
  }
  return ''
}

function pickSelect(property: NotionProperty | undefined): string[] {
  if (!property) return []
  if (property.select) {
    return property.select.name ? [property.select.name] : []
  }
  if (property.multi_select) {
    return property.multi_select.map((s) => s.name || '').filter(Boolean)
  }
  return []
}

function pickImageUrl(page: NotionPage): string | null {
  const prop = page.properties[notionImagePropertyName]
  if (prop?.type === 'files' && prop.files && prop.files.length > 0) {
    const file = prop.files[0]
    return file.type === 'file' ? (file.file?.url ?? null) : (file.external?.url ?? null)
  }
  if (page.cover) {
    return page.cover.type === 'file'
      ? (page.cover.file?.url ?? null)
      : (page.cover.external?.url ?? null)
  }
  return null
}

function pickS3Link(page: NotionPage): string | null {
  const property = page.properties[notionS3LinkPropertyName]
  if (!property) return null

  if (property.type === 'url') {
    return property.url?.trim() || null
  }

  if (property.type === 'rich_text') {
    return property.rich_text?.[0]?.plain_text?.trim() || null
  }

  return null
}

function pickS3LinkPropertyType(page: NotionPage): 'url' | 'rich_text' | null {
  const property = page.properties[notionS3LinkPropertyName]
  if (!property) return null

  if (property.type === 'url' || property.type === 'rich_text') {
    return property.type as 'url' | 'rich_text'
  }

  return null
}

async function downloadImage(url: string) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return {
    contentType: response.headers.get('content-type'),
    data: Buffer.from(arrayBuffer),
  }
}

function resizeImage(originalPath: string, resizedPath: string) {
  const commands: Array<{ command: string; args: string[] }> = [
    {
      command: 'magick',
      args: [
        originalPath,
        '-auto-orient',
        '-resize',
        `${IMAGE_WIDTH}x${IMAGE_WIDTH}^`,
        '-gravity',
        'center',
        '-extent',
        `${IMAGE_WIDTH}x${IMAGE_WIDTH}`,
        '-quality',
        String(IMAGE_QUALITY),
        resizedPath,
      ],
    },
    {
      command: 'convert',
      args: [
        originalPath,
        '-auto-orient',
        '-resize',
        `${IMAGE_WIDTH}x${IMAGE_WIDTH}^`,
        '-gravity',
        'center',
        '-extent',
        `${IMAGE_WIDTH}x${IMAGE_WIDTH}`,
        '-quality',
        String(IMAGE_QUALITY),
        resizedPath,
      ],
    },
  ]

  for (const { command, args } of commands) {
    const result = spawnSync(command, args, { stdio: 'ignore' })
    if (!result.error && result.status === 0) {
      return true
    }
  }
  return false
}

function guessExtension(url: string, contentType: string | null) {
  const fromUrl = extname(new URL(url).pathname)
  if (fromUrl) return fromUrl.toLowerCase()

  if (!contentType) return '.jpg'
  if (contentType.includes('png')) return '.png'
  if (contentType.includes('webp')) return '.webp'
  if (contentType.includes('gif')) return '.gif'

  return '.jpg'
}

async function processPage(
  page: NotionPage,
  index: number
): Promise<{
  member: TeamMember | null
  pendingUpdate: PendingLinkUpdate | null
}> {
  const props = page.properties

  const titleProperty = Object.values(props).find((p) => p.type === 'title')
  const name = pickPlainText(titleProperty)

  if (!name) {
    console.warn(`[sync-notion-team] Page ${page.id} skipped: missing name (title).`)
    return { member: null, pendingUpdate: null }
  }

  const isTeamLead = props[notionTeamLeadPropertyName]?.checkbox ?? false
  const leaveDate = props[notionLeaveDatePropertyName]?.date?.start || null
  const projectLeads = pickSelect(props[notionProjectLeadPropertyName])
  const currentProjects = pickSelect(props[notionProjectPropertyName])
  const pastProjectsRaw = pickSelect(props[notionPastProjectsPropertyName])

  // 역할 결정
  let role = 'Member'
  if (leaveDate) {
    role = '탈퇴 멤버'
  } else if (isTeamLead) {
    role = 'Team Lead'
  } else if (projectLeads.length > 0) {
    role = 'Project Lead'
  }

  // 프로젝트 목록 통합
  const allProjects = new Set<string>()
  projectLeads.forEach((p) => allProjects.add(p))
  currentProjects.forEach((p) => allProjects.add(p))
  pastProjectsRaw.forEach((p) => allProjects.add(p))

  const pastProjects = Array.from(allProjects).sort()

  const bio = pickPlainText(props[notionBioPropertyName])

  const social = {
    github: props[notionGitHubPropertyName]?.url ?? undefined,
  }

  let image = ''
  let pendingUpdate: PendingLinkUpdate | null = null

  // S3 링크 확인
  const savedS3Link = pickS3Link(page)
  const s3LinkPropertyType = pickS3LinkPropertyType(page)

  if (savedS3Link) {
    // 이미 S3 링크가 있으면 다운로드 건너뜀
    image = savedS3Link
  } else {
    // S3 링크가 없으면 다운로드 및 변환 시도
    const imageUrl = pickImageUrl(page)

    if (imageUrl) {
      try {
        const { contentType, data } = await downloadImage(imageUrl)
        const srcExtension = guessExtension(imageUrl, contentType)

        const outputExtension = '.jpg'
        const outputFilename = `${page.id}${outputExtension}`

        const tempFilename = `temp-${page.id}${srcExtension}`
        const tempPath = join(OUTPUT_IMAGE_DIR, tempFilename)
        const finalPath = join(OUTPUT_IMAGE_DIR, outputFilename)

        writeFileSync(tempPath, data)

        const resized = resizeImage(tempPath, finalPath)

        let finalS3Link = ''
        if (resized) {
          finalS3Link = `${OUTPUT_IMAGE_PUBLIC_BASE_PATH}/${outputFilename}`
        } else {
          console.warn(
            `[sync-notion-team] Failed to convert/resize image for ${name}. Using original extension.`
          )
          const fallbackFilename = `${page.id}${srcExtension}`
          const fallbackPath = join(OUTPUT_IMAGE_DIR, fallbackFilename)
          writeFileSync(fallbackPath, data)
          finalS3Link = `${OUTPUT_IMAGE_PUBLIC_BASE_PATH}/${fallbackFilename}`
        }

        image = finalS3Link
        rmSync(tempPath, { force: true })

        // S3 링크 업데이트 준비
        if (s3LinkPropertyType) {
          pendingUpdate = {
            pageId: page.id,
            link: finalS3Link,
            propertyType: s3LinkPropertyType,
          }
        } else {
          console.warn(
            `[sync-notion-team] Page ${page.id}: "${notionS3LinkPropertyName}" property missing or invalid type. Cannot update S3 link.`
          )
        }
      } catch (error) {
        console.error(`[sync-notion-team] Failed to process image for ${name}:`, error)
      }
    }
  }

  return {
    member: {
      id: index,
      name,
      role,
      bio,
      image,
      pastProjects,
      social,
      isTeamLead,
      leaveDate,
    },
    pendingUpdate,
  }
}

function getRolePriority(member: TeamMember): number {
  switch (member.role) {
    case 'Team Lead':
      return 1
    case 'Project Lead':
      return 2
    case 'Member':
      return 3
    case '탈퇴 멤버':
      return 4
    default:
      if (member.role.startsWith('Member')) return 3
      return 5
  }
}

async function run() {
  if (!notionToken || !notionDatabaseId) {
    throw new Error(
      'NOTION_TOKEN and/or NOTION_TEAM_DATABASE_ID environment variables are missing.'
    )
  }

  console.log('[sync-notion-team] Fetching all members from Notion database...')
  const pages = await fetchDatabasePages()

  rmSync(OUTPUT_IMAGE_DIR, { recursive: true, force: true })
  mkdirSync(OUTPUT_IMAGE_DIR, { recursive: true })

  console.log(
    `[sync-notion-team] Processing ${pages.length} members with concurrency limit: ${CONCURRENT_LIMIT}`
  )

  const limit = pLimit(CONCURRENT_LIMIT)
  const results = await Promise.all(
    pages.map((page, index) => limit(() => processPage(page, index + 1)))
  )

  const members: TeamMember[] = []
  const pendingUpdates: PendingLinkUpdate[] = []

  for (const result of results) {
    if (result.member) {
      members.push(result.member)
    }
    if (result.pendingUpdate) {
      pendingUpdates.push(result.pendingUpdate)
    }
  }

  // 정렬 로직 적용
  members.sort((a, b) => {
    const priorityA = getRolePriority(a)
    const priorityB = getRolePriority(b)

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    return a.id - b.id
  })

  if (members.length === 0) {
    console.warn('[sync-notion-team] No members were synced from Notion.')
  }

  mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true })
  writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(members, null, 2)}\n`)
  writeFileSync(OUTPUT_PENDING_UPDATES_PATH, `${JSON.stringify(pendingUpdates, null, 2)}\n`)

  console.log(`[sync-notion-team] Synced ${members.length} member(s).`)
  console.log(`[sync-notion-team] Pending Notion link updates: ${pendingUpdates.length}`)
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('[sync-notion-team] Failed:', message)
  process.exit(1)
})
