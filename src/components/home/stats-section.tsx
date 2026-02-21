import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useMemo } from 'react'
import { Rocket, Users, Calendar, GraduationCap } from 'lucide-react'
import { TeamMember } from '@/types/teamMember.ts'
import generatedTeamMembers from '@/data/team.generated.json'

const FOUNDING_DATE = new Date('2017-03-01')

const teamMembers: TeamMember[] = generatedTeamMembers as TeamMember[]
const activeTeamMembers = generatedTeamMembers.filter((member) => !member.leaveDate)
const totalMemberCount = teamMembers.length
const activeMemberCount = activeTeamMembers.length

export function StatsSection() {
  const yearsSinceFounding = useMemo(() => {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - FOUNDING_DATE.getTime())
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
    return Math.floor(diffYears)
  }, [])

  const stats = useMemo(
    () => [
      {
        icon: Rocket,
        value: '12+',
        label: 'Projects',
        description: '완료된 프로젝트',
      },
      {
        icon: Users,
        value: activeMemberCount,
        label: 'Active Members',
        description: '활동 중인 팀원',
      },
      {
        icon: GraduationCap,
        value: totalMemberCount,
        label: 'Total Members',
        description: '함께한 사람들',
      },
      {
        icon: Calendar,
        value: `${yearsSinceFounding}+`,
        label: 'Years',
        description: '함께한 시간',
      },
    ],
    [yearsSinceFounding]
  )

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-24 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          ref={ref}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
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
                <div className="text-sm font-medium text-foreground mb-1">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
