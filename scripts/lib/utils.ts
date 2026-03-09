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

/**
 * 429 및 5xx 에러에 대한 재시도 정책을 생성하는 팩토리 함수입니다.
 * @param options.logTag 상위 호출부의 logTag 값을 반드시 명시적으로 전달하여
 * 로그 파편화(Log Fragmentation) 현상을 방지해야 합니다.
 */
export function createStandardRetryPolicy({ logTag }: { logTag: string }) {
  return (res: Response) => {
    const isRetryable = res.status === 429 || res.status >= 500
    if (!isRetryable) return false

    return getRetryDelayMs(res.status, res.headers.get('retry-after'), logTag)
  }
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
  maxAttempts?: number
  baseDelayMs?: number
  logTag?: string
  shouldRetry?: (response: Response) => Promise<number | false> | number | false
}

export async function fetchWithRetry(
  url: string | URL | globalThis.Request,
  init?: RequestInit,
  options: FetchWithRetryOptions = {}
): Promise<Response> {
  const {
    maxAttempts: retries = 3,
    baseDelayMs = 1000,
    logTag = 'fetchWithRetry',
    shouldRetry,
  } = options

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, init)

      // 디테일한 재시도 콜백 로직은 DI 받음
      // ex) 400 응답이 오면 재시도없이 통보, 429 응답은 재시도 등등...
      // 여기서는 성공했거나 shouldRetry가 false 처리한 결과를 반환
      if (!response.ok && shouldRetry) {
        const delayMs = await shouldRetry(response)

        if (typeof delayMs === 'number') {
          console.warn(
            `[${logTag}] HTTP ${response.status} (Attempt ${attempt}/${retries}). Retrying in ${delayMs}ms...`
          )
          await sleep(delayMs)
          continue
        }
      }

      return response
    } catch (error) {
      // 네트워크 에러 처리
      const isLastAttempt = attempt === retries
      if (isLastAttempt) {
        throw error
      }

      // 지수 백오프: 1초, 2초, 4초...
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1)
      const errorMessage = error instanceof Error ? error.message : String(error)

      // 로그용으로 쿼리 파라미터를 자르고 path까지만 표시하여 인증 정보 노출 방지
      const safeLogUrl = typeof url === 'string' ? url.split('?')[0] : '...'

      console.warn(
        `[${logTag}] Network error on fetch to ${safeLogUrl} (Attempt ${attempt}/${retries}). Retrying in ${delayMs}ms... Error: ${errorMessage}`
      )

      await sleep(delayMs)
    }
  }

  throw new Error(`[${logTag}] fetchWithRetry failed fundamentally`)
}

export async function downloadImage(
  url: string
): Promise<{ contentType: string | null; data: Buffer }> {
  const logTag = 'downloadImage'
  const response = await fetchWithRetry(url, undefined, {
    maxAttempts: 3,
    logTag,
    shouldRetry: createStandardRetryPolicy({ logTag }),
  })

  if (!response.ok) {
    throw new Error(`[${logTag}] Image download failed: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return {
    contentType: response.headers.get('content-type'),
    data: Buffer.from(arrayBuffer),
  }
}
