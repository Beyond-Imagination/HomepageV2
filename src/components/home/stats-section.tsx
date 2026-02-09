"use client"

import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Rocket, Users, Code, Calendar } from "lucide-react"

const stats = [
  {
    icon: Rocket,
    value: "12+",
    label: "Projects",
    description: "완료된 프로젝트",
  },
  {
    icon: Users,
    value: "8",
    label: "Members",
    description: "활동 중인 팀원",
  },
  {
    icon: Code,
    value: "50K+",
    label: "Lines of Code",
    description: "작성된 코드",
  },
  {
    icon: Calendar,
    value: "3+",
    label: "Years",
    description: "함께한 시간",
  },
]

export function StatsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                className="text-center group"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center group-hover:bg-accent/10 transition-colors">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <div
                  className="text-4xl md:text-5xl font-bold text-primary mb-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-foreground mb-1">
                  {stat.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.description}
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
