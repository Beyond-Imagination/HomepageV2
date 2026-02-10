import { useState } from 'react'

import { Globe, Mail } from 'lucide-react'
import { GitHubIcon } from '@/components/icons/github-icon'

interface TeamMember {
  id: number
  name: string
  role: string
  bio: string
  image: string
  skills: string[]
  social: {
    github?: string
    website?: string
    email?: string
  }
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: '김민수',
    role: 'Team Lead / Full-Stack Developer',
    bio: '10년차 풀스택 개발자로 팀을 이끌고 있습니다. 확장 가능한 아키텍처 설계와 팀 성장에 열정을 가지고 있습니다.',
    image: '/images/team/member-1.jpg',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
    social: {
      github: 'https://github.com',
      website: 'https://example.com',
    },
  },
  {
    id: 2,
    name: '이서연',
    role: 'Frontend Developer',
    bio: '사용자 경험을 최우선으로 생각하는 프론트엔드 개발자입니다. 아름답고 직관적인 인터페이스 구현에 집중합니다.',
    image: '/images/team/member-2.jpg',
    skills: ['React', 'Vue.js', 'Tailwind CSS', 'Figma'],
    social: {
      github: 'https://github.com',
    },
  },
  {
    id: 3,
    name: '박준혁',
    role: 'Backend Developer',
    bio: '안정적이고 효율적인 서버 시스템 구축을 담당합니다. 클라우드 인프라와 DevOps에 관심이 많습니다.',
    image: '/images/team/member-3.jpg',
    skills: ['Python', 'Go', 'PostgreSQL', 'Docker'],
    social: {
      github: 'https://github.com',
      email: 'mailto:example@email.com',
    },
  },
  {
    id: 4,
    name: '최예진',
    role: 'UI/UX Designer',
    bio: '사용자 중심의 디자인으로 제품의 가치를 높입니다. 디자인 시스템 구축과 접근성에 특히 관심을 가지고 있습니다.',
    image: '/images/team/member-4.jpg',
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research'],
    social: {
      website: 'https://example.com',
    },
  },
  {
    id: 5,
    name: '정우성',
    role: 'Mobile Developer',
    bio: 'iOS와 Android 양쪽 플랫폼에서 네이티브 앱을 개발합니다. 크로스 플랫폼 기술에도 깊은 관심을 가지고 있습니다.',
    image: '/images/team/member-5.jpg',
    skills: ['Swift', 'Kotlin', 'React Native', 'Flutter'],
    social: {
      github: 'https://github.com',
    },
  },
  {
    id: 6,
    name: '한소희',
    role: 'Data Engineer',
    bio: '데이터 파이프라인 구축과 분석 시스템을 담당합니다. 대용량 데이터 처리와 ML 인프라에 경험이 있습니다.',
    image: '/images/team/member-6.jpg',
    skills: ['Python', 'Spark', 'Airflow', 'BigQuery'],
    social: {
      github: 'https://github.com',
    },
  },
]

function TeamCard({ member }: { member: TeamMember }) {
  const [imageError, setImageError] = useState(false)

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-64 bg-secondary overflow-hidden">
        {!imageError ? (
          <img
            src={member.image || '/placeholder.svg'}
            alt={member.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-primary/10">
            <span
              className="text-6xl font-bold text-primary/30"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {member.name.charAt(0)}
            </span>
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-primary/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
          {member.social.github && (
            <a
              href={member.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
              aria-label={`${member.name}'s GitHub`}
            >
              <GitHubIcon className="w-5 h-5" />
            </a>
          )}
          {member.social.website && (
            <a
              href={member.social.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
              aria-label={`${member.name}'s Website`}
            >
              <Globe className="w-5 h-5" />
            </a>
          )}
          {member.social.email && (
            <a
              href={member.social.email}
              className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/30 transition-colors"
              aria-label={`Email ${member.name}`}
            >
              <Mail className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3
          className="text-xl font-semibold text-foreground mb-1"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {member.name}
        </h3>
        <p className="text-sm text-accent font-medium mb-3">{member.role}</p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{member.bio}</p>
        <div className="flex flex-wrap gap-2">
          {member.skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TeamGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {teamMembers.map((member) => (
        <TeamCard key={member.id} member={member} />
      ))}
    </div>
  )
}
