import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface Star {
  x: number
  y: number
  size: number
  opacity: number
  life: number
  maxLife: number
}

const MAX_STARS = 100

const createStar = (canvasWidth: number, canvasHeight: number): Star => {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    size: 0.5 + Math.random() * 2,
    opacity: 0,
    life: 0,
    maxLife: 1.5 + Math.random() * 4,
  }
}

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let stars: Star[] = []
    const initStarNum = 30

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      stars = []
      // 초기 별 렌더링
      for (let i = 0; i < initStarNum; i++) {
        stars.push(createStar(canvas.width, canvas.height))
      }
    }

    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 최대 별 개수에 도달하지 않은 경우 지속적으로 별 추가
      if (stars.length < MAX_STARS && Math.random() < 0.02) {
        stars.push(createStar(canvas.width, canvas.height))
      }

      stars.forEach((star, index) => {
        star.life += 1 / 60

        // 최대 생명 주기에 도달한 별은 다시 생성
        if (star.life >= star.maxLife) {
          stars[index] = createStar(canvas.width, canvas.height)
          return
        }

        const progress = star.life / star.maxLife
        star.opacity = Math.sin(progress * Math.PI)

        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 144, 217, ${star.opacity * 0.5})`
        ctx.fill()
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-secondary">
      {/* Background Elements */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 overflow-hidden">
        {/* Orbital Lines */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.03]"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <ellipse
            cx="50"
            cy="50"
            rx="45"
            ry="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.2"
            className="text-primary"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="35"
            ry="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.2"
            className="text-primary"
            transform="rotate(30 50 50)"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="40"
            ry="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.2"
            className="text-primary"
            transform="rotate(-20 50 50)"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        {/* Logo with Parallax */}
        <motion.div
          className="mb-8"
          style={{ y: scrollY * 0.2 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="w-48 h-48 mx-auto rounded-full overflow-hidden relative shadow-primary/20">
            <img
              src="/images/logo.svg"
              alt="Beyond Imagination Logo"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold text-primary mb-6 tracking-tight text-balance"
          style={{ fontFamily: 'var(--font-heading)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Beyond Imagination
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-xl md:text-2xl text-muted-foreground mb-4 text-pretty"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          상상 그 너머의 가능성을 탐구하는 개발자 모임
        </motion.p>

        <motion.p
          className="text-base text-muted-foreground/70 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          우리는 기술의 경계를 넘어, 창의적인 아이디어를 현실로 만들어갑니다.
        </motion.p>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground/50"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.div>
    </section>
  )
}
