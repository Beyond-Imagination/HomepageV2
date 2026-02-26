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

// Preprocessing Types
export type NotionBlock = {
  id: string
  type: string
  has_children: boolean
  child_page?: { title: string }
  child_database?: { title: string }
  heading_3?: { rich_text: Array<{ plain_text: string }> }
  paragraph?: { rich_text: Array<{ plain_text: string; href?: string | null }> }
  toggle?: { rich_text: Array<{ plain_text: string }> }
  bulleted_list_item?: { rich_text: Array<{ plain_text: string }> }
  image?: { type: string; file?: { url?: string }; external?: { url?: string } }
  column_list?: Record<string, unknown>
  column?: Record<string, unknown>
}

export type NotionBlocksResponse = {
  results: NotionBlock[]
  has_more: boolean
  next_cursor: string | null
}

export type ProjectStatus = 'in-progress' | 'completed'

/**
 * src/data/team.generated.json 환경설정 파일에서 팀 멤버 데이터를 가져오기 위한 인터페이스입니다.
 */
export interface TeamMemberProjects {
  name: string
  pastProjects: string[]
}

export interface ParsedProjectData {
  name: string
  status: ProjectStatus
  summary: string
  description: string
  goal: string
  github: string
  demo: string
  techStacks: string[]
  participants: string[]
  date: { start: string; end?: string } | null
  thumbnailUrl?: string | null
  screenshotsUrls?: string[]
}

export interface ExistingProjectData {
  id: string
  thumbnailUrl: string | null
  screenshotsInfoText: string | null
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
