import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/project'

export interface ProjectCardProps {
  project: Project
  index: number
  onClick?: () => void
}

export function ProjectCard({ project, index, onClick }: ProjectCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      viewport={{ once: true }}
      className={cn(
        'group relative overflow-hidden rounded-2xl bg-card border border-border/50 hover:border-border transition-colors',
        onClick && 'cursor-pointer'
      )}
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img
          src={project.thumbnail}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <span
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium',
              project.status === 'in-progress'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            )}
          >
            {project.status === 'in-progress' ? '진행중' : '완료'}
          </span>
          <span className="text-sm text-muted-foreground">
            {project.status === 'in-progress'
              ? project.startDate
              : `${project.startDate} ~ ${project.endDate}`}
          </span>
        </div>

        <h3 className="mb-2 text-xl font-bold tracking-tight">{project.title}</h3>
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">{project.summary}</p>

        <div className="flex flex-wrap gap-2">
          {project.techStack.map((tech) => (
            <span
              key={tech}
              className="rounded-md bg-secondary/50 px-2 py-1 text-xs font-medium text-secondary-foreground"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  )
}
