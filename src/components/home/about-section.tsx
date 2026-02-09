import { motion } from "framer-motion"
import { useInView } from "framer-motion"
import { useRef } from "react"
import { Lightbulb, Target, Heart } from "lucide-react"

const values = [
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "새로운 기술과 아이디어를 끊임없이 탐구하며, 혁신적인 솔루션을 만들어갑니다.",
  },
  {
    icon: Target,
    title: "Excellence",
    description: "품질에 대한 타협 없이, 최고 수준의 결과물을 추구합니다.",
  },
  {
    icon: Heart,
    title: "Collaboration",
    description: "서로의 아이디어를 존중하고, 함께 성장하는 문화를 만들어갑니다.",
  },
]

export function AboutSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl md:text-4xl font-bold text-primary mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            About Us
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
            Beyond Imagination은 열정적인 개발자들이 모여 만든 팀입니다.
            우리는 기술을 통해 상상을 현실로 만들고, 함께 성장하는 것을 목표로 합니다.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {values.map((value) => {
            const Icon = value.icon
            return (
              <motion.div
                key={value.title}
                className="p-8 rounded-2xl bg-secondary/50 hover:bg-secondary transition-colors group"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6 }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <h3
                  className="text-xl font-semibold text-primary mb-3"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {value.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
