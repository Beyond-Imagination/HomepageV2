"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

interface Star {
  id: number

  left: number
  top: number
  duration: number
}

const createStar = (id: number): Star => ({
  id,
  left: Math.random() * 100,
  top: Math.random() * 100,
  duration: 1.5 + Math.random() * 4, // 1.5~5.5초로 더 다양하게
})

export function HeroSection() {
  const [scrollY, setScrollY] = useState(0)
  const [stars, setStars] = useState<Star[]>([])
  const nextIdRef = useRef(0)

  const removeStar = useCallback((id: number) => {
    setStars((stars) => stars.filter((star) => star.id !== id))
  }, [])

  const addStar = useCallback(() => {
    const newId = nextIdRef.current++
    const star = createStar(newId)
    setStars((stars) => [...stars, star])
    // 별의 수명이 다하면 제거 (fade in + 유지 + fade out)
    setTimeout(() => removeStar(newId), star.duration * 1000)
  }, [removeStar])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const initialCount = 30
    nextIdRef.current = initialCount

    for (let i = 0; i < initialCount; i++) {
      const star = createStar(i)
      setStars((stars) => [...stars, star])
      setTimeout(() => removeStar(i), star.duration * 1000)
    }

    // 주기적으로 새 별 추가
    const interval = setInterval(() => {
      addStar()
    }, 30)

    return () => clearInterval(interval)
  }, [addStar, removeStar])

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden bg-secondary">
      {/* Background Elements */}
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

        {/* Stars */}
        <AnimatePresence>
          {stars.map((star) => (
            <motion.div
              key={star.id}
              className="absolute w-1 h-1 bg-accent/50 rounded-full"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: star.duration / 2, ease: "easeInOut" }}
            />
          ))}
        </AnimatePresence>
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
