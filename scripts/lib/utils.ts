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

export async function downloadImage(url: string) {
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
