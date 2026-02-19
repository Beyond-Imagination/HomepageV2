import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Project, ProjectStatus, ProjectCard } from './project-card'
import { ProjectDetailDialog } from './project-detail-dialog'

const projects: Project[] = [
  {
    id: '1',
    title: 'AI Assistant Platform',
    summary: '자연어 처리 기반의 AI 어시스턴트 플랫폼. 사용자 맞춤형 대화 경험을 제공합니다.',
    description:
      '최신 LLM 모델을 활용하여 맥락을 이해하고 자연스러운 대화를 수행하는 AI 어시스턴트입니다. RAG(Retrieval-Augmented Generation) 기술을 도입하여 기업 내부 지식 베이스와 연동되며, 온프레미스 배포를 지원하여 보안성을 강화했습니다.',
    thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
    status: 'in-progress',
    techStack: ['AI', 'Next.js', 'Python'],
    members: ['강민준', '김한빈', '윤재현'],
    goal: '기업 업무 효율화를 위한 맞춤형 AI 비서 서비스 구축',
    github: 'https://github.com',
    startDate: '2024.03',
    screenshots: [
      {
        src: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
        title: 'Screenshot 1',
      },
      {
        src: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=600&fit=crop',
        title: 'Screenshot 2',
      },
      {
        src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
        title: 'Screenshot 3',
      },
    ],
  },
  {
    id: '2',
    title: 'Smart Dashboard',
    summary: '실시간 데이터 시각화 대시보드. 비즈니스 인사이트를 한눈에 파악할 수 있습니다.',
    description:
      '대용량 데이터를 실시간으로 처리하여 직관적인 차트와 그래프로 시각화하는 대시보드 솔루션입니다. 사용자 정의 위젯 시스템을 통해 각 부서별로 필요한 지표를 커스터마이징하여 모니터링할 수 있습니다.',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    status: 'completed',
    techStack: ['React', 'D3.js', 'Node.js'],
    members: ['강민준', '김한빈'],
    goal: '복잡한 비즈니스 데이터의 실시간 모니터링 및 의사결정 지원',
    github: 'https://github.com',
    demo: 'https://demo.com',
    startDate: '2024.03',
    endDate: '2024.09',
    screenshots: [
      {
        src: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
        title: 'Screenshot 1',
      },
      {
        src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
        title: 'Screenshot 2',
      },
    ],
  },
  {
    id: '3',
    title: 'Mobile Health App',
    summary: '개인 건강 관리를 위한 모바일 애플리케이션. 운동, 식단, 수면을 종합적으로 관리합니다.',
    description:
      '사용자의 활동 데이터를 자동으로 수집하고 분석하여 개인 맞춤형 건강 가이드를 제공하는 앱입니다. 웨어러블 기기와의 연동을 지원하며, 게이미피케이션 요소를 도입하여 지속적인 건강 관리를 동기부여합니다.',
    thumbnail: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
    status: 'completed',
    techStack: ['React Native', 'Firebase', 'Health API'],
    members: ['강민준', '윤재현'],
    goal: '사용자 주도적인 헬스케어 습관 형성 돕기',
    github: 'https://github.com',
    demo: 'https://demo.com',
    startDate: '2024.01',
    endDate: '2024.06',
  },
  {
    id: '4',
    title: 'E-commerce Platform',
    summary:
      '현대적인 쇼핑 경험을 제공하는 이커머스 플랫폼. 빠르고 안전한 결제 시스템을 갖추고 있습니다.',
    description:
      'MSA(Microservices Architecture) 기반으로 설계된 확장 가능한 이커머스 시스템입니다. 실시간 재고 관리, 개인화 추천 알고리즘, 그리고 글로벌 결제 모듈 연동을 통해 전 세계 사용자에게 매끄러운 쇼핑 경험을 제공합니다.',
    thumbnail: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    status: 'completed',
    techStack: ['Next.js', 'Stripe', 'PostgreSQL'],
    members: ['강민준', '김한빈', '윤재현'],
    goal: '글로벌 시장 대응이 가능한 고성능 커머스 플랫폼 개발',
    github: 'https://github.com',
    demo: 'https://demo.com',
    startDate: '2024.02',
    endDate: '2024.08',
    screenshots: [
      {
        src: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop',
        title: 'Screenshot 1',
      },
      {
        src: 'https://images.unsplash.com/photo-1472851294608-415522f83ac4?w=800&h=600&fit=crop',
        title: 'Screenshot 2',
      },
    ],
  },
  {
    id: '5',
    title: 'Developer Tools CLI',
    summary: '개발 생산성을 높이는 CLI 도구 모음. 프로젝트 설정부터 배포까지 자동화합니다.',
    description:
      '반복적인 개발 작업을 자동화하여 생산성을 극대화하는 커맨드 라인 도구입니다. 프로젝트 스캐폴딩, 코드 린팅 자동화, CI/CD 파이프라인 생성 등의 기능을 제공하며 플러그인 시스템을 통해 기능을 확장할 수 있습니다.',
    thumbnail: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=600&h=400&fit=crop',
    status: 'in-progress',
    techStack: ['TypeScript', 'Node.js', 'CLI'],
    members: ['강민준'],
    goal: '개발자 경험(DX) 개선 및 프로젝트 초기 설정 시간 단축',
    github: 'https://github.com',
    startDate: '2025.02',
  },
  {
    id: '6',
    title: 'Community Platform',
    summary: '개발자 커뮤니티 플랫폼. 지식 공유와 네트워킹을 위한 공간입니다.',
    description:
      '개발자들이 지식을 공유하고 토론할 수 있는 커뮤니티 공간입니다. 마크다운 에디터, 실시간 알림, 태그 기반 검색 시스템을 갖추고 있으며 개발자 채용 정보 섹션을 통해 커리어 성장을 지원합니다.',
    thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop',
    status: 'completed',
    techStack: ['Next.js', 'Prisma', 'Vercel'],
    members: ['강민준', '윤재현'],
    goal: '개발자들 간의 건강한 소통과 지식 공유 문화 활성화',
    github: 'https://github.com',
    demo: 'https://demo.com',
    startDate: '2023.06',
    endDate: '2023.12',
  },
]

const filters: { value: ProjectStatus; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in-progress', label: '진행중' },
  { value: 'completed', label: '완료' },
]

export function ProjectsGrid() {
  const [activeFilter, setActiveFilter] = useState<ProjectStatus>('all')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const filteredProjects = projects.filter(
    (project) => activeFilter === 'all' || project.status === activeFilter
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
            우리가 만들어온 프로젝트들을 소개합니다. 각 프로젝트에는 팀원들의 열정과 창의력이
            담겨있습니다.
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
                'px-6 py-2 rounded-full text-sm font-medium transition-all',
                activeFilter === filter.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-secondary hover:text-foreground'
              )}
            >
              {filter.label}
            </button>
          ))}
        </motion.div>

        {/* Projects Grid */}
        <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" layout>
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                onClick={() => setSelectedProject(project)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Detail Dialog */}
      <ProjectDetailDialog
        project={selectedProject}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  )
}
