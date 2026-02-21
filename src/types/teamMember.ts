export interface TeamMember {
  id: number
  name: string
  role: string
  bio: string
  image: string
  pastProjects: string[]
  social: {
    github?: string
    website?: string
    email?: string
  }
  leaveDate: string | null
}
