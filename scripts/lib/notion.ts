import { fetchWithRetry, createStandardRetryPolicy } from './utils.ts'
import type { NotionQueryResponse, PendingLinkUpdate, NotionBlocksResponse } from './types.ts'
import {
  NOTION_API_MAX_RETRIES,
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

  const response = await fetchWithRetry(`${NOTION_BASE_URL}${endpoint}`, options, {
    retries: NOTION_API_MAX_RETRIES,
    logTag,
    shouldRetry: createStandardRetryPolicy({ logTag }),
  })

  if (response.ok) {
    const text = await response.text()
    return text ? JSON.parse(text) : {}
  }

  const responseText = await response.text()
  throw new Error(
    `Notion API (${method}) failed: HTTP ${response.status}\nServer Response: ${responseText}`
  )
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
