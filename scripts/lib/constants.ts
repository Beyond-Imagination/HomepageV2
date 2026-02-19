export const NOTION_BASE_URL = 'https://api.notion.com/v1'
export const NOTION_VERSION = '2022-06-28'
export const NOTION_API_MAX_RETRIES = 3
export const NOTION_API_RETRY_DELAY_MS = 500
export const CONCURRENT_LIMIT = 5

export const notionToken = process.env.NOTION_TOKEN

export const notionS3LinkPropertyName = 'S3 link'
