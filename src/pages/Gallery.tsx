import { GalleryGrid } from '@/components/gallery/gallery-grid'

export default function GalleryPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1
            className="text-4xl md:text-5xl font-bold text-primary mb-4"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Gallery
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            함께한 순간들, 성장의 기록들을 담았습니다
          </p>
        </div>

        <GalleryGrid />
      </div>
    </div>
  )
}
