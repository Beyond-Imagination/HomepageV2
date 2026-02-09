import { TeamGrid } from "@/components/team/team-grid"

export default function TeamPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 
            className="text-4xl md:text-5xl font-bold text-primary mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Our Team
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            상상 그 너머의 가능성을 함께 탐구하는 개발자들을 소개합니다
          </p>
        </div>

        <TeamGrid />
      </div>
    </div>
  )
}
