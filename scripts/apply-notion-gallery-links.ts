import { readFileSync } from 'node:fs'

const NOTION_BASE_URL = 'https://api.notion.com/v1'
const NOTION_VERSION = '2022-06-28'
const PENDING_UPDATES_PATH = 'src/data/gallery.pending-link-updates.json'
const NOTION_API_MAX_RETRIES = 3
const NOTION_API_RETRY_DELAY_MS = 500

const notionToken = process.env.NOTION_TOKEN
const notionS3LinkPropertyName = 'S3 link'

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

function parseRetryAfterMs(retryAfter: string | null) {
  if (!retryAfter) return null
  const seconds = Number(retryAfter)
  if (!Number.isNaN(seconds) && seconds >= 0) {
    return Math.ceil(seconds * 1000)
  }

  const dateMs = new Date(retryAfter).getTime()
  if (Number.isNaN(dateMs)) return null
  const diffMs = dateMs - Date.now()
  return diffMs > 0 ? diffMs : 0
}

function getRetryDelayMs(status: number, retryAfterHeader: string | null) {
  if (status === 429) {
    const retryAfterMs = parseRetryAfterMs(retryAfterHeader)
    if (retryAfterMs !== null) return retryAfterMs

    console.warn(
      '[apply-notion-gallery-links] 429 received without a valid Retry-After header. Falling back to default backoff.'
    )
    return NOTION_API_RETRY_DELAY_MS
  }

  return NOTION_API_RETRY_DELAY_MS
}

async function notionUpdatePage(pageId: string, payload: Record<string, unknown>) {
  for (let attempt = 1; attempt <= NOTION_API_MAX_RETRIES; attempt += 1) {
    try {
      const response = await fetch(`${NOTION_BASE_URL}/pages/${pageId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${notionToken}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        return
      }

      const responseText = await response.text()
      const isRetryable = response.status === 429 || response.status >= 500
      if (!isRetryable || attempt === NOTION_API_MAX_RETRIES) {
        throw new Error(`Notion page update failed: ${response.status} ${responseText}`)
      }

      const retryAfterMs = getRetryDelayMs(response.status, response.headers.get('retry-after'))
      console.warn(
        `[apply-notion-gallery-links] Notion update retry ${attempt}/${NOTION_API_MAX_RETRIES} after ${retryAfterMs}ms: ${response.status}`
      )
      await sleep(retryAfterMs)
    } catch (error) {
      if (attempt === NOTION_API_MAX_RETRIES) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Notion page update failed after retries: ${message}`)
      }

      console.warn(
        `[apply-notion-gallery-links] Notion update network retry ${attempt}/${NOTION_API_MAX_RETRIES} after ${NOTION_API_RETRY_DELAY_MS}ms`
      )
      await sleep(NOTION_API_RETRY_DELAY_MS)
    }
  }

  throw new Error('Notion page update failed: retry loop terminated unexpectedly')
}

async function updatePageS3Link(update: PendingLinkUpdate) {
  const propertyPayload =
    update.propertyType === 'rich_text'
      ? {
          rich_text: [{ type: 'text', text: { content: update.link } }],
        }
      : { url: update.link }

  await notionUpdatePage(update.pageId, {
    properties: {
      [notionS3LinkPropertyName]: propertyPayload,
    },
  })
}

function readPendingUpdates() {
  const raw = readFileSync(PENDING_UPDATES_PATH, 'utf-8')
  const parsed = JSON.parse(raw) as PendingLinkUpdate[]
  if (!Array.isArray(parsed)) {
    throw new Error(`${PENDING_UPDATES_PATH} must be a JSON array`)
  }
  return parsed
}

async function run() {
  if (!notionToken) {
    throw new Error('NOTION_TOKEN is required')
  }

  const updates = readPendingUpdates()
  if (updates.length === 0) {
    console.log('[apply-notion-gallery-links] No pending updates. Skipping.')
    return
  }

  for (const update of updates) {
    await updatePageS3Link(update)
  }

  console.log(`[apply-notion-gallery-links] Updated ${updates.length} Notion page link(s).`)
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('[apply-notion-gallery-links] Failed:', error)
  console.error('[apply-notion-gallery-links] Message:', message)
  process.exit(1)
})
