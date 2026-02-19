import { run } from './lib/apply-notion-links.ts'

const PENDING_UPDATES_PATH = 'src/data/team.pending-link-updates.json'
const LOG_TAG = 'apply-notion-team-links'

run(PENDING_UPDATES_PATH, LOG_TAG).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[${LOG_TAG}] Failed:`, error)
  console.error(`[${LOG_TAG}] Message:`, message)
  process.exit(1)
})
