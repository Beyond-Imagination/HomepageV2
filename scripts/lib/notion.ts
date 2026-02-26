import { getRetryDelayMs, sleep } from './utils.ts'
import type { NotionQueryResponse, PendingLinkUpdate, NotionBlocksResponse } from './types.ts'
import {
  NOTION_API_MAX_RETRIES,
  NOTION_API_RETRY_DELAY_MS,
  NOTION_BASE_URL,
  NOTION_VERSION,
  notionS3LinkPropertyName,
  notionToken,
} from './constants.ts'

async function notionFetch(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH',
  body: Record<string, unknown> | null,
  logTag: string
): Promise<unknown> {
  for (let attempt = 1; attempt <= NOTION_API_MAX_RETRIES; attempt += 1) {
    try {
      const options: RequestInit = {
        method,
        headers: {
          Authorization: `Bearer ${notionToken}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
      }
      if (body) {
        options.body = JSON.stringify(body)
      }

      const response = await fetch(`${NOTION_BASE_URL}${endpoint}`, options)

      if (response.ok) {
        const text = await response.text()
        return text ? JSON.parse(text) : {}
      }

      const responseText = await response.text()
      const isRetryable = response.status === 429 || response.status >= 500
      if (!isRetryable || attempt === NOTION_API_MAX_RETRIES) {
        throw new Error(`Notion API (${method}) failed: ${response.status} ${responseText}`)
      }

      const retryAfterMs = getRetryDelayMs(
        response.status,
        response.headers.get('retry-after'),
        logTag
      )
      console.warn(
        `[${logTag}] Retry ${attempt}/${NOTION_API_MAX_RETRIES} after ${retryAfterMs}ms: ${response.status}`
      )
      await sleep(retryAfterMs)
    } catch (error) {
      if (attempt === NOTION_API_MAX_RETRIES) {
        throw error instanceof Error ? error : new Error(String(error))
      }
      console.warn(`[${logTag}] Network retry ${attempt}/${NOTION_API_MAX_RETRIES}`)
      await sleep(NOTION_API_RETRY_DELAY_MS)
    }
  }
  throw new Error('Notion API failed: retry loop terminated unexpectedly')
}

export async function notionRequest<T>(
  path: string,
  body: Record<string, unknown>,
  logTag: string
): Promise<NotionQueryResponse<T>> {
  return (await notionFetch(path, 'POST', body, logTag)) as NotionQueryResponse<T>
}

async function notionUpdatePage(pageId: string, payload: Record<string, unknown>, logTag: string) {
  return notionFetch(`/pages/${pageId}`, 'PATCH', payload, logTag)
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

export async function updatePageProperty(
  pageId: string,
  properties: Record<string, unknown>,
  logTag: string
) {
  return notionUpdatePage(
    pageId,
    {
      properties,
    },
    logTag
  )
}

// 요 아래는 preprocess 과정에서 recursive하게 페이지를 파싱하고, notion db에 가져온 데이터를 write하는데 활용됨
export async function getBlockChildren(
  blockId: string,
  logTag: string,
  startCursor?: string
): Promise<NotionBlocksResponse> {
  const query = startCursor ? `?page_size=100&start_cursor=${startCursor}` : '?page_size=100'
  return (await notionFetch(
    `/blocks/${blockId}/children${query}`,
    'GET',
    null,
    logTag
  )) as NotionBlocksResponse
}

export async function createPage(
  databaseId: string,
  properties: Record<string, unknown>,
  logTag: string
) {
  const payload = {
    parent: { database_id: databaseId },
    properties,
  }
  return notionFetch('/pages', 'POST', payload, logTag)
}

export async function getPage(pageId: string, logTag: string) {
  return notionFetch(`/pages/${pageId}`, 'GET', null, logTag)
}
