export type NotionFile = {
  type: 'external' | 'file'
  external?: { url: string }
  file?: { url: string }
}

export type TeamNotionProperty = {
  type: string
  files?: NotionFile[]
  title?: Array<{ plain_text?: string }>
  rich_text?: Array<{ plain_text?: string }>
  date?: { start?: string }
  checkbox?: boolean
  select?: { name?: string }
  multi_select?: Array<{ name?: string }>
  url?: string
  email?: string
}

export type TeamNotionPage = {
  id: string
  properties: Record<string, TeamNotionProperty>
  cover?: NotionFile
}

export type GalleryNotionProperty = {
  type: string
  files?: NotionFile[]
  title?: Array<{ plain_text?: string }>
  select?: { name?: string }
  multi_select?: Array<{ name?: string }>
  rich_text?: Array<{ plain_text?: string }>
  date?: { start?: string }
  url?: string | null
}

export type GalleryNotionPage = {
  id: string
  created_time: string
  properties: Record<string, GalleryNotionProperty>
  cover?: NotionFile
}

export type FaqNotionProperty = {
  type: string
  title?: Array<{ plain_text?: string }>
  rich_text?: Array<{ plain_text?: string }>
  checkbox?: boolean
  number?: number | null
}

export type FaqNotionPage = {
  id: string
  created_time: string
  properties: Record<string, FaqNotionProperty>
}

export type NotionQueryResponse<P> = {
  results: P[]
  has_more: boolean
  next_cursor: string | null
}

export type PendingLinkUpdate = {
  pageId: string
  link: string
  propertyType: 'url' | 'rich_text'
}

export type ProjectPendingUpdate = {
  pageId: string
  properties: Record<string, unknown>
}

export type ProjectNotionProperty = {
  type: string
  title?: Array<{ plain_text?: string }>
  rich_text?: Array<{ plain_text?: string }>
  date?: { start?: string; end?: string | null }
  select?: { name?: string }
  multi_select?: Array<{ name?: string }>
  people?: Array<{ name?: string }>
  files?: NotionFile[]
  formula?: { boolean?: boolean }
  url?: string | null
  status?: { name?: string }
}

export type ProjectNotionPage = {
  id: string
  created_time: string
  properties: Record<string, ProjectNotionProperty>
  cover?: NotionFile
}

export type FaqItem = {
  question: string
  answer: string
}
