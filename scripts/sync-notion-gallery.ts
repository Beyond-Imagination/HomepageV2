import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, extname, join } from 'node:path'

const NOTION_BASE_URL = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'
const OUTPUT_JSON_PATH = 'src/data/gallery.generated.json'
const OUTPUT_IMAGE_ORIGINAL_DIR = 'public/images/gallery/original'
const OUTPUT_IMAGE_THUMB_DIR = 'public/images/gallery/thumb'
const OUTPUT_IMAGE_ORIGINAL_PUBLIC_BASE_PATH = '/images/gallery/original'
const OUTPUT_IMAGE_THUMB_PUBLIC_BASE_PATH = '/images/gallery/thumb'
const THUMB_WIDTH = 640
const THUMB_QUALITY = 72

const notionToken = process.env.NOTION_TOKEN
const notionDatabaseId = process.env.NOTION_GALLERY_DATABASE_ID
const notionImagePropertyName = '파일'
const notionCategoryPropertyName = '카테고리'
const notionDatePropertyName = '날짜'
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
  select?: { name?: string }
  multi_select?: Array<{ name?: string }>
  rich_text?: Array<{ plain_text?: string }>
  date?: { start?: string }
  url?: string | null
}

type NotionPage = {
  id: string
  created_time: string
  properties: Record<string, NotionProperty>
  cover?: NotionFile
}

type NotionQueryResponse = {
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}

type GalleryItem = {
  id: number
  src: string
  thumbnailSrc: string
  alt: string
  categories: string[]
  date: string
}

function toDisplayDate(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

function pickPageTitle(page: NotionPage) {
  const titleProperty = Object.values(page.properties).find((property) => property.type === 'title')
  if (!titleProperty || !Array.isArray(titleProperty.title)) return 'Notion Gallery Image'

  const text = titleProperty.title
    .map((item) => item.plain_text ?? '')
    .join('')
    .trim()
  return text || 'Notion Gallery Image'
}

function pickCategories(page: NotionPage) {
  const property = page.properties[notionCategoryPropertyName]
  if (!property) return ['기타']

  if (property.type === 'select') {
    const value = property.select?.name?.trim()
    return value ? [value] : ['기타']
  }

  if (property.type === 'multi_select') {
    const values = (property.multi_select ?? [])
      .map((item) => item.name?.trim() ?? '')
      .filter((value) => value.length > 0)
    return values.length > 0 ? Array.from(new Set(values)) : ['기타']
  }

  if (property.type === 'rich_text') {
    const raw = property.rich_text?.[0]?.plain_text?.trim() ?? ''
    if (!raw) return ['기타']
    const values = raw
      .split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
    return values.length > 0 ? Array.from(new Set(values)) : ['기타']
  }

  return ['기타']
}

function pickDate(page: NotionPage) {
  const property = page.properties[notionDatePropertyName]
  if (property?.type === 'date' && property.date?.start) return toDisplayDate(property.date.start)
  return toDisplayDate(page.created_time) || '날짜 미정'
}

function pickSortableTimestamp(page: NotionPage) {
  const fromDateProperty = page.properties[notionDatePropertyName]?.date?.start
  const fromCreatedTime = page.created_time
  const value = fromDateProperty ?? fromCreatedTime
  const timestamp = value ? new Date(value).getTime() : Number.NaN
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function pickS3Link(page: NotionPage) {
  const property = page.properties[notionS3LinkPropertyName]
  if (!property) return null

  if (property.type === 'url') {
    const value = property.url?.trim()
    return value ? value : null
  }

  if (property.type === 'rich_text') {
    const value = property.rich_text?.[0]?.plain_text?.trim()
    return value ? value : null
  }

  return null
}

function pickImageUrl(page: NotionPage) {
  const target = page.properties[notionImagePropertyName]
  const targetFiles = target?.files ?? []
  if (target?.type === 'files' && targetFiles.length > 0) {
    const firstFile = targetFiles[0]
    if (firstFile.type === 'external') return firstFile.external?.url ?? null
    if (firstFile.type === 'file') return firstFile.file?.url ?? null
  }

  for (const property of Object.values(page.properties)) {
    const files = property.files ?? []
    if (property.type !== 'files' || files.length === 0) continue
    const file = files[0]
    if (file.type === 'external' && file.external?.url) return file.external.url
    if (file.type === 'file' && file.file?.url) return file.file.url
  }

  if (page.cover?.type === 'external') return page.cover.external?.url ?? null
  if (page.cover?.type === 'file') return page.cover.file?.url ?? null

  return null
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

async function notionRequest(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${NOTION_BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Notion API request failed: ${response.status} ${text}`)
  }

  return (await response.json()) as NotionQueryResponse
}

async function notionUpdatePage(pageId: string, payload: Record<string, unknown>) {
  const response = await fetch(`${NOTION_BASE_URL}/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${notionToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Notion page update failed: ${response.status} ${text}`)
  }
}

async function updatePageS3Link(page: NotionPage, link: string) {
  const property = page.properties[notionS3LinkPropertyName]

  if (!property) {
    throw new Error(`Property "${notionS3LinkPropertyName}" not found in page properties`)
  }

  if (property.type === 'url') {
    await notionUpdatePage(page.id, {
      properties: {
        [notionS3LinkPropertyName]: { url: link },
      },
    })
    return
  }

  if (property.type === 'rich_text') {
    await notionUpdatePage(page.id, {
      properties: {
        [notionS3LinkPropertyName]: {
          rich_text: [{ type: 'text', text: { content: link } }],
        },
      },
    })
    return
  }

  throw new Error(`Property "${notionS3LinkPropertyName}" must be "url" or "rich_text" type`)
}

async function fetchDatabasePages() {
  const pages: NotionPage[] = []
  let startCursor: string | undefined = undefined

  while (true) {
    const data = await notionRequest(`/databases/${notionDatabaseId}/query`, {
      page_size: 100,
      start_cursor: startCursor,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
    })

    pages.push(...data.results)

    if (!data.has_more || !data.next_cursor) break
    startCursor = data.next_cursor
  }

  return pages
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

function createThumbnail(originalPath: string, thumbPath: string) {
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

function inferThumbnailLinkFromOriginal(originalLink: string, pageId: string) {
  const normalized = originalLink.trim()
  if (!normalized) return null

  if (normalized.includes(`/images/gallery/original/${pageId}`)) {
    return `${OUTPUT_IMAGE_THUMB_PUBLIC_BASE_PATH}/${pageId}-thumb.webp`
  }

  return null
}

async function run() {
  if (!notionToken || !notionDatabaseId) {
    throw new Error('NOTION_TOKEN/NOTION_GALLERY_DATABASE_ID missing.')
  }

  console.log('[sync-notion-gallery] Fetching pages from Notion database...')
  const pages = await fetchDatabasePages()
  pages.sort((a, b) => pickSortableTimestamp(b) - pickSortableTimestamp(a))

  rmSync(OUTPUT_IMAGE_ORIGINAL_DIR, { recursive: true, force: true })
  rmSync(OUTPUT_IMAGE_THUMB_DIR, { recursive: true, force: true })
  mkdirSync(OUTPUT_IMAGE_ORIGINAL_DIR, { recursive: true })
  mkdirSync(OUTPUT_IMAGE_THUMB_DIR, { recursive: true })

  const items: GalleryItem[] = []
  let index = 1
  const failures: string[] = []

  for (const page of pages) {
    const categories = pickCategories(page)
    const date = pickDate(page)
    const title = pickPageTitle(page)

    const savedS3Link = pickS3Link(page)
    if (savedS3Link) {
      items.push({
        id: index,
        src: savedS3Link,
        thumbnailSrc: inferThumbnailLinkFromOriginal(savedS3Link, page.id) ?? savedS3Link,
        alt: title,
        categories,
        date,
      })
      index += 1
      continue
    }

    const imageUrl = pickImageUrl(page)
    if (!imageUrl) {
      failures.push(`Page ${page.id}: image URL not found`)
      continue
    }

    try {
      const { contentType, data } = await downloadImage(imageUrl)
      const extension = guessExtension(imageUrl, contentType)
      const originalFilename = `${page.id}${extension}`
      const thumbFilename = `${page.id}-thumb.webp`
      const originalPath = join(OUTPUT_IMAGE_ORIGINAL_DIR, originalFilename)
      const thumbPath = join(OUTPUT_IMAGE_THUMB_DIR, thumbFilename)
      const originalS3Link = `${OUTPUT_IMAGE_ORIGINAL_PUBLIC_BASE_PATH}/${originalFilename}`
      const thumbS3Link = `${OUTPUT_IMAGE_THUMB_PUBLIC_BASE_PATH}/${thumbFilename}`

      rmSync(originalPath, { force: true })
      rmSync(thumbPath, { force: true })
      writeFileSync(originalPath, data)
      const thumbCreated = createThumbnail(originalPath, thumbPath)

      if (!thumbCreated) {
        throw new Error('Thumbnail generation failed. Install ImageMagick (magick/convert).')
      }

      await updatePageS3Link(page, originalS3Link)

      items.push({
        id: index,
        src: originalS3Link,
        thumbnailSrc: thumbS3Link,
        alt: title,
        categories,
        date,
      })
      index += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`Page ${page.id}: ${message}`)
    }
  }

  if (items.length === 0) {
    throw new Error('No images were synced from Notion.')
  }

  if (failures.length > 0) {
    const summary = failures.slice(0, 10).join('\n')
    const more = failures.length > 10 ? `\n...and ${failures.length - 10} more` : ''
    throw new Error(`Failed to fetch some Notion images (${failures.length}):\n${summary}${more}`)
  }

  mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true })
  writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(items, null, 2)}\n`)
  console.log(`[sync-notion-gallery] Synced ${items.length} image(s).`)
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('[sync-notion-gallery] Failed:', error)
  console.error('[sync-notion-gallery] Message:', message)
  process.exit(1)
})
