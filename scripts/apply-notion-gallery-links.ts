import { run } from './lib/apply-notion-updates.ts'

const PENDING_UPDATES_PATH = 'src/data/gallery.pending-link-updates.json'
const LOG_TAG = 'apply-notion-gallery-links'

import { updatePageS3Link } from './lib/notion.ts'
import type { PendingLinkUpdate } from './lib/types.ts'

run<PendingLinkUpdate>(PENDING_UPDATES_PATH, LOG_TAG, updatePageS3Link).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[${LOG_TAG}] Failed:`, error)
  console.error(`[${LOG_TAG}] Message:`, message)
  process.exit(1)
})
