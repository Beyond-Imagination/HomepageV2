export interface Screenshot {
  src: string
  title: string
}

export type ProjectStatus = 'in-progress' | 'completed'
export type ProjectFilter = 'all' | ProjectStatus

export interface ProjectBase {
  id: number | string
  title: string
  thumbnail: string
  techStack: string[]
  members: string[]
  goal: string
  github?: string
  demo?: string
  description?: string
  summary: string
  screenshots?: Screenshot[]
  startDate: string
}

export interface ProjectInProgress extends ProjectBase {
  status: 'in-progress'
}

export interface ProjectCompleted extends ProjectBase {
  status: 'completed'
  endDate: string
}

export type Project = ProjectInProgress | ProjectCompleted
