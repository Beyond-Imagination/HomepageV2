import { useState } from 'react'
import { Globe, Mail } from 'lucide-react'
import { GitHubIcon } from '@/components/icons/github-icon'
import { TeamMember } from '@/types/teamMember'
import generatedTeamMembers from '@/data/team.generated.json'

const teamMembers: TeamMember[] = generatedTeamMembers as TeamMember[]
const TEAM_LEADER_ROLE = '팀 리더'

function TeamCard({ member }: { member: TeamMember }) {
  const [imageError, setImageError] = useState(false)
  const isTeamLeader = member.role === TEAM_LEADER_ROLE

  return (
    <div
      className={`group rounded-xl border overflow-hidden transition-all duration-300 hover:-translate-y-1 ${
        isTeamLeader
          ? 'bg-linear-to-b from-accent/10 to-card border-2 border-accent/50 shadow-[0_12px_28px_-14px_hsl(var(--accent)/0.8)] hover:shadow-[0_16px_36px_-14px_hsl(var(--accent)/0.95)]'
          : 'bg-card border-border hover:shadow-lg'
      }`}
    >
      {/* Image */}
      <div className="relative h-64 bg-secondary overflow-hidden">
        {isTeamLeader && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground shadow">
            팀 리더
          </span>
        )}
        {!imageError && member.image ? (
          <img
            src={member.image}
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
        <p
          className={`text-sm font-medium mb-3 ${isTeamLeader ? 'text-accent' : 'text-accent/80'}`}
        >
          {member.role}
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4">{member.bio}</p>
        <div className="flex flex-wrap gap-2">
          {member.pastProjects.map((project) => (
            <span
              key={project}
              className="px-3 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded-full"
            >
              {project}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function TeamGrid() {
  const activeMembers = teamMembers.filter((member) => !member.leaveDate)
  const alumniMembers = teamMembers.filter((member) => member.leaveDate)

  return (
    <div className="space-y-16">
      <section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeMembers.map((member) => (
            <TeamCard key={member.id} member={member} />
          ))}
        </div>
      </section>
      <div className="w-full border-t border-border" />
      {alumniMembers.length > 0 && (
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {alumniMembers.map((member) => (
              <TeamCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
