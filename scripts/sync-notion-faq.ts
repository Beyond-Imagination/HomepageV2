import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { notionRequest } from './lib/notion.ts'
import type {
  FaqItem,
  FaqNotionPage as NotionPage,
  FaqNotionProperty as NotionProperty,
  NotionQueryResponse,
} from './lib/types.ts'
import { notionToken } from './lib/constants.ts'

const OUTPUT_JSON_PATH = 'src/data/contact-faq.generated.json'
const LOG_TAG = 'sync-notion-faq'
const notionDatabaseId = process.env.NOTION_FAQ_DATABASE_ID

const notionQuestionPropertyName = '질문'
const notionAnswerPropertyName = '답변'
const notionSortWeightPropertyName = '정렬 가중치'

function toPlainText(property?: NotionProperty): string {
  if (!property) return ''
  if (property.type === 'title' && Array.isArray(property.title)) {
    return property.title
      .map((token) => token.plain_text ?? '')
      .join('')
      .trim()
  }
  if (property.type === 'rich_text' && Array.isArray(property.rich_text)) {
    return property.rich_text
      .map((token) => token.plain_text ?? '')
      .join('')
      .trim()
  }
  return ''
}

function pickQuestion(page: NotionPage): string {
  const named = toPlainText(page.properties[notionQuestionPropertyName])
  if (named) return named

  const titleProperty = Object.values(page.properties).find((property) => property.type === 'title')
  return toPlainText(titleProperty)
}

function pickAnswer(page: NotionPage): string {
  const named = toPlainText(page.properties[notionAnswerPropertyName])
  if (named) return named

  const firstRichText = Object.values(page.properties).find(
    (property) => property.type === 'rich_text' && toPlainText(property).length > 0
  )
  return toPlainText(firstRichText)
}

function pickSortWeight(page: NotionPage): number {
  const number = page.properties[notionSortWeightPropertyName]?.number

  if (number != null && !isNaN(number)) {
    return number
  }

  return 2 ** 32 - 1 // 지정하지 않으면 가장 마지막으로
}

async function fetchDatabasePages() {
  const pages: NotionPage[] = []
  let startCursor: string | undefined = undefined

  while (true) {
    const data: NotionQueryResponse<NotionPage> = await notionRequest<NotionPage>(
      `/databases/${notionDatabaseId}/query`,
      {
        page_size: 100,
        start_cursor: startCursor,
      },
      LOG_TAG
    )

    pages.push(...data.results)

    if (!data.has_more || !data.next_cursor) break
    startCursor = data.next_cursor
  }

  return pages
}

async function run() {
  if (!notionToken) {
    throw new Error('NOTION_TOKEN environment variable is missing.')
  }
  if (!notionDatabaseId) {
    throw new Error('NOTION_FAQ_DATABASE_ID environment variable is missing.')
  }

  console.log(`[${LOG_TAG}] Fetching FAQ entries from Notion database...`)
  const pages = await fetchDatabasePages()

  const faqItems = pages
    .map((page) => {
      const question = pickQuestion(page)
      const answer = pickAnswer(page)
      const sortWeight = pickSortWeight(page)

      if (!question || !answer) {
        console.warn(`[${LOG_TAG}] Page ${page.id} skipped: missing question or answer.`)
        return null
      }

      return {
        question,
        answer,
        sortWeight,
      } satisfies FaqItem
    })
    .filter((item): item is FaqItem => item !== null)
    .sort((a, b) => a.sortWeight - b.sortWeight) // sortWeight 오름차순

  mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true })
  writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(faqItems, null, 2)}\n`)
  console.log(`[${LOG_TAG}] Synced ${faqItems.length} FAQ item(s).`)
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[${LOG_TAG}] Failed:`, error)
  console.error(`[${LOG_TAG}] Message:`, message)
  process.exit(1)
})
