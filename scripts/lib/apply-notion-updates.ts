import { readFileSync } from 'node:fs'
import { sleep } from './utils.ts'
import { notionToken } from './constants.ts'

function readPendingUpdates<T>(updatePath: string): T[] {
  try {
    const raw = readFileSync(updatePath, 'utf-8')
    const parsed = JSON.parse(raw) as T[]
    if (!Array.isArray(parsed)) {
      throw new Error(`${updatePath} must be a JSON array`)
    }
    return parsed
  } catch (error) {
    // 예외 처리: 파일이 존재하지 않을 경우 (로컬 개발 환경에서 sync 없이 수동으로 실행할 경우)
    // 이게 필요할까 싶지만 src/data가 버전 관리되고 있지 않기에.. 예외처리로 두는 것이 자연스럽게 느껴짐
    if (
      error instanceof Error &&
      'code' in error &&
      (error as NodeJS.ErrnoException).code === 'ENOENT'
    ) {
      return []
    }
    throw error
  }
}

export async function run<T>(
  updatePath: string,
  logTag: string,
  processor: (item: T, logTag: string) => Promise<void>
) {
  if (!notionToken) {
    throw new Error('NOTION_TOKEN is required')
  }

  const updates = readPendingUpdates<T>(updatePath)
  if (updates.length === 0) {
    console.log(`[${logTag}] No pending updates. Skipping.`)
    return
  }

  console.log(`[${logTag}] Updating ${updates.length} Notion page/item(s)...`)

  let successCount = 0
  for (const update of updates) {
    try {
      await processor(update, logTag)
      successCount++
      await sleep(200)
    } catch (e) {
      console.error(`[${logTag}] Failed to update item:`, e)
    }
  }

  console.log(`[${logTag}] Updated ${successCount}/${updates.length} Notion page/item(s).`)
}
