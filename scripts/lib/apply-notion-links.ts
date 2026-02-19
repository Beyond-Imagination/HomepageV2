import { readFileSync } from 'node:fs'
import { updatePageS3Link } from './notion.ts'
import { sleep } from './utils.ts'
import { notionToken } from './constants.ts'

type PendingLinkUpdate = {
  pageId: string
  link: string
  propertyType: 'url' | 'rich_text'
}

function readPendingUpdates(updatePath: string) {
  const raw = readFileSync(updatePath, 'utf-8')
  const parsed = JSON.parse(raw) as PendingLinkUpdate[]
  if (!Array.isArray(parsed)) {
    throw new Error(`${updatePath} must be a JSON array`)
  }
  return parsed
}

export async function run(updatePath: string, logTag: string) {
  if (!notionToken) {
    throw new Error('NOTION_TOKEN is required')
  }

  const updates = readPendingUpdates(updatePath)
  if (updates.length === 0) {
    console.log(`[${logTag}] No pending updates. Skipping.`)
    return
  }

  console.log(`[${logTag}] Updating ${updates.length} Notion page link(s)...`)

  for (const update of updates) {
    await updatePageS3Link(update, logTag)
    await sleep(200)
  }

  console.log(`[${logTag}] Updated ${updates.length} Notion page link(s).`)
}
