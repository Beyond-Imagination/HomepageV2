import { useState, useEffect } from 'react'
import { ExternalLink, Calendar, Users, Target, Layers, ArrowLeft } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel'
import { Project, Screenshot } from './project-card'
import { cn } from '@/lib/utils'
import { GitHubIcon } from '@/components/icons/github-icon'

interface ProjectDetailDialogProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
}

// 타입 가드 헬퍼
function getScreenshotSrc(item: string | Screenshot): string {
  return typeof item === 'string' ? item : item.src
}

function getScreenshotTitle(item: string | Screenshot): string | undefined {
  return typeof item === 'string' ? undefined : item.title
}

export function ProjectDetailDialog({ project, isOpen, onClose }: ProjectDetailDialogProps) {
  // viewMode: 'details' | 'gallery'
  // gallery 모드일 때는 팝업 전체가 이미지 뷰어로 변환됨
  const [viewMode, setViewMode] = useState<'details' | 'gallery'>('details')
  const [initialSlideIndex, setInitialSlideIndex] = useState(0)
  const [slideController, setSlideController] = useState<CarouselApi>()
  const [currentSlide, setCurrentSlide] = useState(0)

  // 팝업이 닫힐 때 viewMode 초기화
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setViewMode('details')
        setInitialSlideIndex(0)
        setCurrentSlide(0)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // 슬라이드 컨트롤러가 준비되면 이벤트 리스너 등록 및 초기 이동
  useEffect(() => {
    if (!slideController) {
      return
    }

    // 초기 슬라이드로 이동
    if (viewMode === 'gallery') {
      slideController.scrollTo(initialSlideIndex, true)
    }

    const onSelect = () => {
      setCurrentSlide(slideController.selectedScrollSnap())
    }

    slideController.on('select', onSelect)
    slideController.on('reInit', onSelect)

    // 초기값 설정
    onSelect()

    return () => {
      slideController.off('select', onSelect)
      slideController.off('reInit', onSelect)
    }
  }, [slideController, viewMode, initialSlideIndex])

  if (!project) return null

  const screenshots = project.screenshots || []

  // 이미지 클릭 핸들러 (인-팝업 갤러리 모드로 전환)
  const handleScreenshotClick = (index: number) => {
    setInitialSlideIndex(index)

    // 갤러리 모드로 전환
    setViewMode('gallery')
  }

  // 갤러리에서 뒤로가기
  const handleBackToDetails = () => {
    setViewMode('details')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'sm:max-w-4xl w-[95vw] max-h-[95vh] p-0 border-none bg-background shadow-2xl transition-all duration-300',
          viewMode === 'gallery'
            ? 'h-[90vh] sm:h-[95vh] overflow-hidden'
            : 'h-auto overflow-y-auto overscroll-contain'
        )}
      >
        {/* 1. Details View */}
        <div
          className={cn(
            'w-full transition-opacity duration-300 pb-10',
            viewMode === 'details' ? 'opacity-100 block' : 'opacity-0 hidden'
          )}
        >
          {/* Hero Section */}
          <div className="relative w-full h-64 md:h-80 bg-muted">
            <img
              src={project.thumbnail}
              alt={project.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium backdrop-blur-md',
                    project.status === 'in-progress'
                      ? 'bg-accent/90 text-accent-foreground'
                      : 'bg-primary/90 text-primary-foreground'
                  )}
                >
                  {project.status === 'in-progress' ? '진행중' : '완료'}
                </span>
                <div className="flex items-center gap-1.5 text-sm font-medium text-foreground/80 bg-background/30 backdrop-blur-md px-3 py-1 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {project.status === 'in-progress'
                      ? project.startDate
                      : `${project.startDate} ~ ${project.endDate}`}
                  </span>
                </div>
              </div>

              <DialogTitle
                className="text-3xl md:text-4xl font-bold text-foreground mb-2"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {project.title}
              </DialogTitle>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6 md:p-8 space-y-8">
            {/* Summary & Description */}
            <div>
              <DialogDescription className="text-base md:text-lg leading-relaxed text-muted-foreground">
                {project.description || project.summary}
              </DialogDescription>
            </div>

            <div className="h-px bg-border my-6" />

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Members */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Users className="w-5 h-5" />
                    <h3>프로젝트 멤버</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.members && project.members.length > 0 ? (
                      project.members.map((member) => (
                        <span
                          key={member}
                          className="px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md text-sm font-medium"
                        >
                          {member}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">정보 없음</span>
                    )}
                  </div>
                </div>

                {/* Goal */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Target className="w-5 h-5" />
                    <h3>프로젝트 목표</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {project.goal || '목표 정보가 없습니다.'}
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Tech Stack */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-primary font-semibold">
                    <Layers className="w-5 h-5" />
                    <h3>기술 스택</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {project.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-3 py-1.5 border border-border text-muted-foreground rounded-md text-xs font-medium hover:bg-secondary/50 transition-colors cursor-default"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Links */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-primary">관련 링크</h3>
                  <div className="flex flex-col gap-2">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:bg-secondary/50 hover:border-accent/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary rounded-lg group-hover:bg-background transition-colors">
                            <GitHubIcon className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">Source Code</span>
                            <span className="text-xs text-muted-foreground">
                              GitHub 저장소 바로가기
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 rounded-xl border border-border hover:bg-secondary/50 hover:border-accent/50 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-secondary rounded-lg group-hover:bg-background transition-colors">
                            <ExternalLink className="w-5 h-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">Live Demo</span>
                            <span className="text-xs text-muted-foreground">
                              배포된 서비스 체험하기
                            </span>
                          </div>
                        </div>
                        <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Screenshots Section (Carousel Preview) */}
            {screenshots.length > 0 && (
              <>
                <div className="h-px bg-border my-8" />
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-primary">예시 화면</h3>
                  <div className="relative px-4">
                    <Carousel
                      opts={{
                        align: 'start',
                        loop: true,
                      }}
                      className="w-full"
                    >
                      <CarouselContent className="">
                        {screenshots.map((item, index) => {
                          const src = getScreenshotSrc(item)
                          const title = getScreenshotTitle(item)
                          return (
                            <CarouselItem key={src} className="pl-4 basis-1/2 md:basis-1/3">
                              <div
                                className="rounded-xl overflow-hidden border border-border shadow-sm bg-muted/30 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all aspect-video group"
                                onClick={() => handleScreenshotClick(index)}
                              >
                                <img
                                  src={src}
                                  alt={title || `${project.title} screenshot ${index + 1}`}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                              </div>
                            </CarouselItem>
                          )
                        })}
                      </CarouselContent>
                      <CarouselPrevious className="-left-4" />
                      <CarouselNext className="-right-4" />
                    </Carousel>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2. Gallery View (In-Popup) */}
        <div
          className={cn(
            'w-full h-full bg-black/95 flex flex-col items-center justify-center p-4 transition-opacity duration-300 absolute inset-0 z-40',
            viewMode === 'gallery'
              ? 'opacity-100 pointer-events-auto'
              : 'opacity-0 pointer-events-none'
          )}
        >
          {/* Back Button (In-Popup Navigation) */}
          <button
            onClick={handleBackToDetails}
            className="absolute left-4 top-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="sr-only">Back to details</span>
          </button>

          {/* Full Screen Carousel */}
          <div className="w-full h-full flex items-center justify-center">
            <Carousel
              setSlideController={setSlideController}
              opts={{
                loop: true,
                align: 'center',
              }}
              className="w-full max-w-4xl h-full flex items-center"
            >
              <CarouselContent className="h-full">
                {screenshots.map((item, index) => {
                  const src = getScreenshotSrc(item)
                  const title = getScreenshotTitle(item)
                  return (
                    <CarouselItem
                      key={src}
                      className="h-full flex items-center justify-center basis-full"
                    >
                      <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img
                          src={src}
                          alt={title || `${project.title} screenshot ${index + 1}`}
                          className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        />
                      </div>
                    </CarouselItem>
                  )
                })}
              </CarouselContent>
              <CarouselPrevious className="left-4 bg-white/10 hover:bg-white/20 text-white border-none" />
              <CarouselNext className="right-4 bg-white/10 hover:bg-white/20 text-white border-none" />
            </Carousel>
          </div>

          {/* Indicator & Title */}
          <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none flex flex-col items-center gap-2">
            <h3 className="text-white text-lg font-medium drop-shadow-md">
              {(screenshots[currentSlide] && getScreenshotTitle(screenshots[currentSlide])) || ''}
            </h3>
            <p className="text-white/50 text-sm">
              {currentSlide + 1} / {screenshots.length}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
