import { extname } from 'node:path'
import { NOTION_API_RETRY_DELAY_MS } from './constants.ts'

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

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export function getRetryDelayMs(status: number, retryAfterHeader: string | null, logTag: string) {
  if (status === 429) {
    const retryAfterMs = parseRetryAfterMs(retryAfterHeader)
    if (retryAfterMs !== null) return retryAfterMs

    console.warn(
      `[${logTag}] 429 received without a valid Retry-After header. Falling back to default backoff.`
    )
    return NOTION_API_RETRY_DELAY_MS
  }

  return NOTION_API_RETRY_DELAY_MS
}

export function guessExtension(url: string, contentType: string | null) {
  const fromUrl = extname(new URL(url).pathname)
  if (fromUrl) return fromUrl.toLowerCase()

  if (!contentType) return '.jpg'
  if (contentType.includes('png')) return '.png'
  if (contentType.includes('webp')) return '.webp'
  if (contentType.includes('gif')) return '.gif'

  return '.jpg'
}

export interface FetchWithRetryOptions {
  retries?: number
  baseDelayMs?: number
  logTag?: string
}

export async function fetchWithRetry(
  url: string | URL | globalThis.Request,
  init?: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const { retries = 3, baseDelayMs = 1000, logTag = 'fetchWithRetry' } = options

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init)

      // 여기서는 네트워크 그 자체의 에러 상황만 처리
      return response
    } catch (error) {
      const isLastAttempt = attempt === retries
      if (isLastAttempt) {
        throw error
      }

      // 지수 백오프: 1초, 2초, 4초...
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1)
      const errorMessage = error instanceof Error ? error.message : String(error)

      console.warn(
        `[${logTag}] Network error on fetch to ${typeof url === 'string' ? url : '...'} (Attempt ${attempt}/${retries}). Retrying in ${delayMs}ms... Error: ${errorMessage}`
      )

      await sleep(delayMs)
    }
  }

  throw new Error(`[${logTag}] fetchWithRetry failed fundamentally`)
}

export async function downloadImage(
  url: string
): Promise<{ contentType: string | null; data: Buffer }> {
  const response = await fetchWithRetry(url, undefined, {
    retries: 3,
    logTag: 'downloadImage',
  })

  if (!response.ok) {
    throw new Error(`Image download failed: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return {
    contentType: response.headers.get('content-type'),
    data: Buffer.from(arrayBuffer),
  }
}
