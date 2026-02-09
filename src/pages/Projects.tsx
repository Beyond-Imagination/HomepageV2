import { ProjectsGrid } from "@/components/projects/projects-grid"

export const metadata = {
  title: "Projects | Beyond Imagination",
  description: "Beyond Imagination 팀의 프로젝트를 소개합니다.",
}

export default function ProjectsPage() {
  return (
    <div className="pt-16">
      <ProjectsGrid />
    </div>
  )
}
