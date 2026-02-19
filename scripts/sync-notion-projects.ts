import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'
import pLimit from 'p-limit'
import { notionRequest, updatePageProperty } from './lib/notion.ts'
import type { ProjectNotionPage as NotionPage, NotionQueryResponse } from './lib/types.ts'
import { CONCURRENT_LIMIT, notionToken } from './lib/constants.ts'
import { downloadImage, guessExtension } from './lib/utils.ts'
import type { Project, Screenshot } from '../src/types/project.ts'

const OUTPUT_JSON_PATH = 'src/data/projects.generated.json'
const OUTPUT_IMAGE_ORIGINAL_DIR = 'public/images/projects/original'
const OUTPUT_IMAGE_THUMB_DIR = 'public/images/projects/thumb'
const OUTPUT_IMAGE_THUMB_PUBLIC_BASE_PATH = '/images/projects/thumb'
const OUTPUT_IMAGE_ORIGINAL_PUBLIC_BASE_PATH = '/images/projects/original'
const THUMB_WIDTH = 640
const THUMB_QUALITY = 72
const LOG_TAG = 'sync-notion-projects'

const notionDatabaseId = process.env.NOTION_PROJECTS_DATABASE_ID

// Notion Properties
const notionFormulaPropertyName = '유효성 검증'
const notionThumbnailUrlPropertyName = 'thumbnail_url'
const notionScreenshotsPropertyName = 'screenshots'
const notionScreenshotsInfoPropertyName = 'screenshots_info'
const notionThumbnailPropertyName = 'thumbnail'
const notionStatusPropertyName = 'Status'
const notionDatePropertyName = 'Date'
const notionTechStackPropertyName = 'tech-stacks'
const notionSummaryPropertyName = 'summary'
const notionDescriptionPropertyName = 'description'
const notionGoalPropertyName = 'goal'
const notionGithubPropertyName = 'github'
const notionDemoPropertyName = 'demo'
const notionParticipantsPropertyName = 'participants'

const validationPassed = '✅'

// TODO: <refactor> 아래는 추후 공통 lib로 빠질 수 있음
class ImageProcessor {
  createThumbnail(originalPath: string, thumbPath: string) {
    const commands: Array<{ command: string; args: string[] }> = [
      {
        command: 'magick',
        args: [
          originalPath,
          '-auto-orient',
          '-resize',
          `${THUMB_WIDTH}>`,
          '-quality',
          String(THUMB_QUALITY),
          thumbPath,
        ],
      },
      {
        command: 'convert',
        args: [
          originalPath,
          '-auto-orient',
          '-resize',
          `${THUMB_WIDTH}>`,
          '-quality',
          String(THUMB_QUALITY),
          thumbPath,
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

  getFirstFileUrl(page: NotionPage, propertyName: string) {
    const property = page.properties[propertyName]
    if (property?.type !== 'files' || !property.files?.length) return null
    const file = property.files[0]
    if (file.type === 'external') return file.external?.url
    if (file.type === 'file') return file.file?.url
    return null
  }

  getFileUrls(page: NotionPage, propertyName: string) {
    const property = page.properties[propertyName]
    if (property?.type !== 'files' || !property.files?.length) return []
    return property.files
      .map((file) => {
        if (file.type === 'external') return file.external?.url
        if (file.type === 'file') return file.file?.url
        return null
      })
      .filter((url): url is string => !!url)
  }

  async processThumbnail(page: NotionPage, propertyName: string) {
    const sourceUrl = this.getFirstFileUrl(page, propertyName)
    if (!sourceUrl) return null

    const { contentType, data } = await downloadImage(sourceUrl)
    const extension = guessExtension(sourceUrl, contentType)

    const thumbFilename = `${page.id}-thumbnail.webp`
    const normalizedOriginalPath = join(
      OUTPUT_IMAGE_ORIGINAL_DIR,
      `${page.id}-thumbnail${extension}`
    )
    const thumbPath = join(OUTPUT_IMAGE_THUMB_DIR, thumbFilename)

    writeFileSync(normalizedOriginalPath, data)
    const mbThumbCreated = this.createThumbnail(normalizedOriginalPath, thumbPath)

    let finalUrl = ''
    if (mbThumbCreated) {
      finalUrl = `${OUTPUT_IMAGE_THUMB_PUBLIC_BASE_PATH}/${thumbFilename}`
    } else {
      finalUrl = `${OUTPUT_IMAGE_ORIGINAL_PUBLIC_BASE_PATH}/${page.id}-thumbnail${extension}`
    }

    return { url: finalUrl }
  }

  async processScreenshots(page: NotionPage, propertyName: string) {
    const sourceUrls = this.getFileUrls(page, propertyName)
    if (sourceUrls.length === 0) return []

    const newScreenshots: Screenshot[] = []

    for (let i = 0; i < sourceUrls.length; i++) {
      const url = sourceUrls[i]
      try {
        const { contentType, data } = await downloadImage(url)
        const extension = guessExtension(url, contentType)
        const filename = `${page.id}-screenshot-${i}${extension}`
        const webpFilename = `${page.id}-screenshot-${i}.webp`

        const originalPath = join(OUTPUT_IMAGE_ORIGINAL_DIR, filename)
        const thumbPath = join(OUTPUT_IMAGE_THUMB_DIR, webpFilename)

        writeFileSync(originalPath, data)

        this.createThumbnail(originalPath, thumbPath)

        newScreenshots.push({
          src: `${OUTPUT_IMAGE_THUMB_PUBLIC_BASE_PATH}/${webpFilename}`,
          title: `Screenshot ${i + 1}`,
        })
      } catch (e) {
        console.error(`Failed to process screenshot ${i} for page ${page.id}:`, e)
      }
    }

    return newScreenshots
  }
}

// TODO: <refactor> 추후 공통 lib 로 빠질 수 있음
class ProjectMapper {
  toYearMonthDate(value?: string) {
    if (!value) return ''
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    return `${year}.${month}`
  }

  pickPageTitle(page: NotionPage) {
    const titleProperty = Object.values(page.properties).find(
      (property) => property.type === 'title'
    )
    if (!titleProperty || !Array.isArray(titleProperty.title)) return 'Untitled Project'

    const text = titleProperty.title
      .map((item) => item.plain_text ?? '')
      .join('')
      .trim()
    return text || 'Untitled Project'
  }

  pickRichText(page: NotionPage, propertyName: string) {
    const property = page.properties[propertyName]
    if (property?.type !== 'rich_text') return ''
    return (
      property.rich_text
        ?.map((t) => t.plain_text)
        .join('')
        .trim() || ''
    )
  }

  pickUrl(page: NotionPage, propertyName: string) {
    const property = page.properties[propertyName]
    if (property?.type !== 'url') return undefined
    return property.url || undefined
  }

  pickMultiSelect(page: NotionPage, propertyName: string) {
    const property = page.properties[propertyName]
    if (property?.type !== 'multi_select') return []
    return property.multi_select?.map((item) => item.name || '').filter(Boolean) || []
  }

  pickPeople(page: NotionPage, propertyName: string) {
    const property = page.properties[propertyName]
    if (property?.type !== 'people') return []
    return property.people?.map((person) => person.name || '').filter(Boolean) || []
  }

  pickStatus(page: NotionPage): 'in-progress' | 'completed' {
    const property = page.properties[notionStatusPropertyName]

    if (property?.type === 'status') {
      const name = property.status?.name?.toLowerCase()
      if (name === 'completed' || name === '완료' || name === 'done') return 'completed'
      return 'in-progress'
    }

    if (property?.type === 'select') {
      const name = property.select?.name?.toLowerCase()
      if (name === 'completed' || name === '완료') return 'completed'
      return 'in-progress'
    }

    return 'in-progress'
  }

  pickDate(page: NotionPage) {
    const property = page.properties[notionDatePropertyName]
    if (property?.type !== 'date' || !property.date) return { startDate: '', endDate: undefined }

    return {
      startDate: this.toYearMonthDate(property.date.start),
      endDate: property.date.end ? this.toYearMonthDate(property.date.end) : undefined,
    }
  }

  pickThumbnailUrl(page: NotionPage) {
    const property = page.properties[notionThumbnailUrlPropertyName]
    if (property?.type === 'url') return property.url
    if (property?.type === 'rich_text') return property.rich_text?.[0]?.plain_text
    return null
  }

  pickScreenshotsInfo(page: NotionPage): Screenshot[] {
    const property = page.properties[notionScreenshotsInfoPropertyName]
    if (property?.type !== 'rich_text') return []
    const text = property.rich_text?.[0]?.plain_text
    if (!text) return []
    try {
      return JSON.parse(text)
    } catch {
      return []
    }
  }

  mapNotionPageToProject(
    page: NotionPage,
    index: number,
    thumbUrl?: string | null,
    screenshots?: Screenshot[]
  ): Project {
    const title = this.pickPageTitle(page)
    const summary = this.pickRichText(page, notionSummaryPropertyName)
    const description = this.pickRichText(page, notionDescriptionPropertyName)
    const goal = this.pickRichText(page, notionGoalPropertyName)
    const techStack = this.pickMultiSelect(page, notionTechStackPropertyName)
    const members = this.pickPeople(page, notionParticipantsPropertyName)
    const github = this.pickUrl(page, notionGithubPropertyName)
    const demo = this.pickUrl(page, notionDemoPropertyName)
    const { startDate, endDate } = this.pickDate(page)
    const status = this.pickStatus(page)

    const project: Project = {
      id: index,
      title,
      status,
      summary,
      description,
      goal,
      techStack,
      members,
      startDate,
      endDate: endDate || '',
      thumbnail: thumbUrl || '',
      github,
      demo,
      screenshots,
    }

    return project
  }
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
        filter: {
          property: notionFormulaPropertyName,
          formula: {
            string: {
              equals: validationPassed,
            },
          },
        },
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      },
      LOG_TAG
    )

    pages.push(...data.results)

    if (!data.has_more || !data.next_cursor) break
    startCursor = data.next_cursor
  }

  return pages
}

const imageProcessor = new ImageProcessor()
const projectMapper = new ProjectMapper()

async function processPage(page: NotionPage, index: number) {
  const title = page.properties.Name?.title?.[0]?.plain_text || page.id

  // Image Processing
  let thumbnailUrl = projectMapper.pickThumbnailUrl(page)
  let screenshots = projectMapper.pickScreenshotsInfo(page)
  const pendingUpdates: Record<string, unknown> = {}

  // 1. Thumbnail Processing
  if (!thumbnailUrl) {
    try {
      const result = await imageProcessor.processThumbnail(page, notionThumbnailPropertyName)
      if (result) {
        thumbnailUrl = result.url
        pendingUpdates[notionThumbnailUrlPropertyName] = { url: thumbnailUrl }
      }
    } catch (e) {
      console.error(`[${LOG_TAG}] Failed to process thumbnail for ${title}:`, e)
    }
  }

  // 2. Screenshots Processing
  if (screenshots.length === 0) {
    try {
      const newScreenshots = await imageProcessor.processScreenshots(
        page,
        notionScreenshotsPropertyName
      )
      if (newScreenshots.length > 0) {
        screenshots = newScreenshots
        pendingUpdates[notionScreenshotsInfoPropertyName] = {
          rich_text: [{ type: 'text', text: { content: JSON.stringify(screenshots) } }],
        }
      }
    } catch (e) {
      console.error(`[${LOG_TAG}] Failed to process screenshots for ${title}:`, e)
    }
  }

  if (Object.keys(pendingUpdates).length > 0) {
    try {
      await updatePageProperty(page.id, pendingUpdates, LOG_TAG)
      console.log(`[${LOG_TAG}] Updated properties for ${title}`)
    } catch (e) {
      console.error(`[${LOG_TAG}] Failed to update Notion properties for ${title}:`, e)
    }
  }

  return projectMapper.mapNotionPageToProject(page, index, thumbnailUrl, screenshots)
}

async function run() {
  if (!notionToken || !notionDatabaseId) {
    throw new Error('NOTION_TOKEN/NOTION_PROJECTS_DATABASE_ID missing.')
  }

  console.log(`[${LOG_TAG}] Fetching pages from Notion database...`)
  const pages = await fetchDatabasePages()

  // Clean dirs
  rmSync(OUTPUT_IMAGE_ORIGINAL_DIR, { recursive: true, force: true })
  rmSync(OUTPUT_IMAGE_THUMB_DIR, { recursive: true, force: true })
  mkdirSync(OUTPUT_IMAGE_ORIGINAL_DIR, { recursive: true })
  mkdirSync(OUTPUT_IMAGE_THUMB_DIR, { recursive: true })

  console.log(
    `[${LOG_TAG}] Processing ${pages.length} pages with concurrency limit: ${CONCURRENT_LIMIT}`
  )

  const limit = pLimit(CONCURRENT_LIMIT)
  const projects = await Promise.all(
    pages.map((page, index) => limit(() => processPage(page, index + 1)))
  )

  // Save JSON
  mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true })
  writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(projects, null, 2)}\n`)
  console.log(`[${LOG_TAG}] Synced ${projects.length} project(s).`)
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[${LOG_TAG}] Failed:`, error)
  console.error(`[${LOG_TAG}] Message:`, message)
  process.exit(1)
})
