import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, Github, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

type ProjectStatus = "all" | "in-progress" | "completed"

interface Project {
  id: string
  title: string
  description: string
  thumbnail: string
  status: "in-progress" | "completed"
  tags: string[]
  github?: string
  demo?: string
  year: string
}

const projects: Project[] = [
  {
    id: "1",
    title: "AI Assistant Platform",
    description: "자연어 처리 기반의 AI 어시스턴트 플랫폼. 사용자 맞춤형 대화 경험을 제공합니다.",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop",
    status: "in-progress",
    tags: ["AI", "Next.js", "Python"],
    github: "https://github.com",
    year: "2025",
  },
  {
    id: "2",
    title: "Smart Dashboard",
    description: "실시간 데이터 시각화 대시보드. 비즈니스 인사이트를 한눈에 파악할 수 있습니다.",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    status: "completed",
    tags: ["React", "D3.js", "Node.js"],
    github: "https://github.com",
    demo: "https://demo.com",
    year: "2024",
  },
  {
    id: "3",
    title: "Mobile Health App",
    description: "개인 건강 관리를 위한 모바일 애플리케이션. 운동, 식단, 수면을 종합적으로 관리합니다.",
    thumbnail: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop",
    status: "completed",
    tags: ["React Native", "Firebase", "Health API"],
    github: "https://github.com",
    demo: "https://demo.com",
    year: "2024",
  },
  {
    id: "4",
    title: "E-commerce Platform",
    description: "현대적인 쇼핑 경험을 제공하는 이커머스 플랫폼. 빠르고 안전한 결제 시스템을 갖추고 있습니다.",
    thumbnail: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop",
    status: "completed",
    tags: ["Next.js", "Stripe", "PostgreSQL"],
    github: "https://github.com",
    demo: "https://demo.com",
    year: "2024",
  },
  {
    id: "5",
    title: "Developer Tools CLI",
    description: "개발 생산성을 높이는 CLI 도구 모음. 프로젝트 설정부터 배포까지 자동화합니다.",
    thumbnail: "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&h=400&fit=crop",
    status: "in-progress",
    tags: ["TypeScript", "Node.js", "CLI"],
    github: "https://github.com",
    year: "2025",
  },
  {
    id: "6",
    title: "Community Platform",
    description: "개발자 커뮤니티 플랫폼. 지식 공유와 네트워킹을 위한 공간입니다.",
    thumbnail: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
    status: "completed",
    tags: ["Next.js", "Prisma", "Vercel"],
    github: "https://github.com",
    demo: "https://demo.com",
    year: "2023",
  },
]

const filters: { value: ProjectStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "in-progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
]

export function ProjectsGrid() {
  const [activeFilter, setActiveFilter] = useState<ProjectStatus>("all")

  const filteredProjects = projects.filter(
    (project) => activeFilter === "all" || project.status === activeFilter
  )

  return (
    <section className="py-24 bg-secondary/30 min-h-screen">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1
            className="text-4xl md:text-5xl font-bold text-primary mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Projects
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            우리가 만들어온 프로젝트들을 소개합니다. 각 프로젝트에는 팀원들의 열정과 창의력이 담겨있습니다.
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          className="flex justify-center gap-2 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setActiveFilter(filter.value)}
              className={cn(
                "px-6 py-2 rounded-full text-sm font-medium transition-all",
                activeFilter === filter.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <motion.article
                key={project.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="bg-background rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow group"
              >
                {/* Thumbnail */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={project.thumbnail || "/placeholder.svg"}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-medium",
                        project.status === "in-progress"
                          ? "bg-accent text-accent-foreground"
                          : "bg-primary text-primary-foreground"
                      )}
                    >
                      {project.status === "in-progress" ? "In Progress" : "Completed"}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>{project.year}</span>
                  </div>
                  <h3
                    className="text-lg font-semibold text-primary mb-2 group-hover:text-accent transition-colors"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-secondary text-xs text-muted-foreground rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Links */}
                  <div className="flex items-center gap-3">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors"
                      >
                        <Github className="w-4 h-4" />
                        <span>Code</span>
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-accent transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Demo</span>
                      </a>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
