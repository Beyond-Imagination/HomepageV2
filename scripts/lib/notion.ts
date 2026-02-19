import { getRetryDelayMs, sleep } from './utils.ts'
import type { NotionQueryResponse, PendingLinkUpdate } from './types.ts'
import {
  NOTION_API_MAX_RETRIES,
  NOTION_API_RETRY_DELAY_MS,
  NOTION_BASE_URL,
  NOTION_VERSION,
  notionS3LinkPropertyName,
  notionToken,
} from './constants.ts'

export async function notionRequest<T>(
  path: string,
  body: Record<string, unknown>,
  logTag: string
): Promise<NotionQueryResponse<T>> {
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
        return (await response.json()) as NotionQueryResponse<T>
      }

      const responseText = await response.text()
      const isRetryable = response.status === 429 || response.status >= 500
      if (!isRetryable || attempt === NOTION_API_MAX_RETRIES) {
        throw new Error(`Notion API request failed: ${response.status} ${responseText}`)
      }

      const retryAfterMs = getRetryDelayMs(
        response.status,
        response.headers.get('retry-after'),
        logTag
      )
      console.warn(
        `[${logTag}] Notion request retry ${attempt}/${NOTION_API_MAX_RETRIES} after ${retryAfterMs}ms: ${response.status}`
      )
      await sleep(retryAfterMs)
    } catch (error) {
      if (attempt === NOTION_API_MAX_RETRIES) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Notion API request failed after retries: ${message}`)
      }
      console.warn(
        `[${logTag}] Notion request network retry ${attempt}/${NOTION_API_MAX_RETRIES} after ${NOTION_API_RETRY_DELAY_MS}ms`
      )
      await sleep(NOTION_API_RETRY_DELAY_MS)
    }
  }
  throw new Error('Notion API request failed: retry loop terminated unexpectedly')
}

async function notionUpdatePage(pageId: string, payload: Record<string, unknown>, logTag: string) {
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

      const retryAfterMs = getRetryDelayMs(
        response.status,
        response.headers.get('retry-after'),
        logTag
      )
      console.warn(
        `[${logTag}] Notion update retry ${attempt}/${NOTION_API_MAX_RETRIES} after ${retryAfterMs}ms: ${response.status}`
      )
      await sleep(retryAfterMs)
    } catch (error) {
      if (attempt === NOTION_API_MAX_RETRIES) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Notion page update failed after retries: ${message}`)
      }

      console.warn(
        `[${logTag}] Notion update network retry ${attempt}/${NOTION_API_MAX_RETRIES} after ${NOTION_API_RETRY_DELAY_MS}ms`
      )
      await sleep(NOTION_API_RETRY_DELAY_MS)
    }
  }

  throw new Error('Notion page update failed: retry loop terminated unexpectedly')
}

export async function updatePageS3Link(update: PendingLinkUpdate, logTag: string) {
  const propertyPayload =
    update.propertyType === 'rich_text'
      ? {
          rich_text: [{ type: 'text', text: { content: update.link } }],
        }
      : { url: update.link }

  await notionUpdatePage(
    update.pageId,
    {
      properties: {
        [notionS3LinkPropertyName]: propertyPayload,
      },
    },
    logTag
  )
}
