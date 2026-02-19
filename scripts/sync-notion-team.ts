import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import pLimit from 'p-limit'
import { notionRequest } from './lib/notion.ts'
import type {
  NotionQueryResponse,
  PendingLinkUpdate,
  TeamNotionPage as NotionPage,
  TeamNotionProperty as NotionProperty,
} from './lib/types.ts'
import { CONCURRENT_LIMIT, notionS3LinkPropertyName, notionToken } from './lib/constants.ts'
import { downloadImage, guessExtension } from './lib/utils.ts'

const OUTPUT_JSON_PATH = 'src/data/team.generated.json'
const OUTPUT_PENDING_UPDATES_PATH = 'src/data/team.pending-link-updates.json'
const OUTPUT_IMAGE_DIR = 'public/images/team'
const OUTPUT_IMAGE_PUBLIC_BASE_PATH = '/images/team'
const IMAGE_WIDTH = 512
const IMAGE_QUALITY = 80
const LOG_TAG = 'sync-notion-team'

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

const MemberType = {
  Leader: '팀 리더',
  Member: '멤버',
  Alumni: '졸업 멤버',
} as const

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

async function fetchDatabasePages() {
  const pages: NotionPage[] = []
  let startCursor: string | undefined = undefined

  while (true) {
    const data: NotionQueryResponse<NotionPage> = await notionRequest<NotionPage>(
      `/databases/${notionDatabaseId}/query`,
      {
        page_size: 100,
        start_cursor: startCursor,
        sorts: [{ property: notionJoinDatePropertyName, direction: 'ascending' }],
      },
      LOG_TAG
    )

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

function resizeImage(originalPath: string, resizedPath: string) {
  const args = [
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
  ]
  const commands = ['magick', 'convert']

  for (const command of commands) {
    const result = spawnSync(command, args, { stdio: 'ignore' })
    if (!result.error && result.status === 0) {
      return true
    }
  }
  return false
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
    console.warn(`[${LOG_TAG}] Page ${page.id} skipped: missing name (title).`)
    return { member: null, pendingUpdate: null }
  }

  const isTeamLead = props[notionTeamLeadPropertyName]?.checkbox ?? false
  const leaveDate = props[notionLeaveDatePropertyName]?.date?.start || null
  const projectLeads = pickSelect(props[notionProjectLeadPropertyName])
  const currentProjects = pickSelect(props[notionProjectPropertyName])
  const pastProjectsRaw = pickSelect(props[notionPastProjectsPropertyName])

  // 역할 결정
  let role: string = MemberType.Member
  if (leaveDate) {
    role = MemberType.Alumni
  } else if (isTeamLead) {
    role = MemberType.Leader
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
    image = savedS3Link
  } else {
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
            `[${LOG_TAG}] Failed to convert/resize image for ${name}. Using original extension.`
          )
          const fallbackFilename = `${page.id}${srcExtension}`
          const fallbackPath = join(OUTPUT_IMAGE_DIR, fallbackFilename)
          writeFileSync(fallbackPath, data)
          finalS3Link = `${OUTPUT_IMAGE_PUBLIC_BASE_PATH}/${fallbackFilename}`
        }

        image = finalS3Link
        rmSync(tempPath, { force: true })

        if (s3LinkPropertyType) {
          pendingUpdate = {
            pageId: page.id,
            link: finalS3Link,
            propertyType: s3LinkPropertyType,
          }
        } else {
          console.warn(
            `[${LOG_TAG}] Page ${page.id}: "${notionS3LinkPropertyName}" property missing or invalid type. Cannot update S3 link.`
          )
        }
      } catch (error) {
        console.error(`[${LOG_TAG}] Failed to process image for ${name}:`, error)
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
    case MemberType.Leader:
      return 1
    case MemberType.Member:
      return 2
    case MemberType.Alumni:
      return 3
    default:
      return 4
  }
}

async function run() {
  if (!notionToken || !notionDatabaseId) {
    throw new Error(
      'NOTION_TOKEN and/or NOTION_TEAM_DATABASE_ID environment variables are missing.'
    )
  }

  console.log(`[${LOG_TAG}] Fetching all members from Notion database...`)
  const pages = await fetchDatabasePages()

  rmSync(OUTPUT_IMAGE_DIR, { recursive: true, force: true })
  mkdirSync(OUTPUT_IMAGE_DIR, { recursive: true })

  console.log(
    `[${LOG_TAG}] Processing ${pages.length} members with concurrency limit: ${CONCURRENT_LIMIT}`
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

  members.sort((a, b) => {
    const priorityA = getRolePriority(a)
    const priorityB = getRolePriority(b)

    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }

    return a.id - b.id
  })

  if (members.length === 0) {
    console.warn(`[${LOG_TAG}] No members were synced from Notion.`)
  }

  mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true })
  writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(members, null, 2)}\n`)
  writeFileSync(OUTPUT_PENDING_UPDATES_PATH, `${JSON.stringify(pendingUpdates, null, 2)}\n`)

  console.log(`[${LOG_TAG}] Synced ${members.length} member(s).`)
  console.log(`[${LOG_TAG}] Pending Notion link updates: ${pendingUpdates.length}`)
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[${LOG_TAG}] Failed:`, error)
  console.error(`[${LOG_TAG}] Message:`, message)
  process.exit(1)
})
