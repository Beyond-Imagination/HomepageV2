import { useEffect, useMemo, useRef, useState } from 'react'

import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import generatedGalleryItems from '@/data/gallery.generated.json'

type GalleryItem = {
  id: number
  src: string
  thumbnailSrc: string
  alt: string
  category?: string
  categories?: string[]
  date: string
}

function getItemCategories(item: GalleryItem) {
  if (Array.isArray(item.categories) && item.categories.length > 0) return item.categories
  if (item.category?.trim()) return [item.category.trim()]
  return ['기타']
}

function resolveImageSrc(src?: string) {
  if (!src) return '/placeholder.svg'

  const trimmed = src.trim()
  if (!trimmed) return '/placeholder.svg'
  if (trimmed.startsWith('/')) return trimmed
  if (trimmed.startsWith('images/')) return `/${trimmed}`

  return trimmed
}

const notionGalleryItems = generatedGalleryItems as GalleryItem[]

function parseDateToOrderValue(item: GalleryItem) {
  const raw = item.date?.trim() ?? ''
  const match = raw.match(/^(\d{4})\.(\d{2})\.(\d{2})$/)
  if (match) {
    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return Date.UTC(year, month - 1, day)
    }
  }

  const normalized = raw.replaceAll('.', '-')
  const parsed = normalized ? new Date(`${normalized}T00:00:00Z`).getTime() : Number.NaN
  if (!Number.isNaN(parsed)) return parsed
  return 0
}

function GalleryCard({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const cardRef = useRef<HTMLButtonElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const target = cardRef.current
    if (!target || isVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px 0px' }
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [isVisible])

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-xl bg-secondary cursor-pointer"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '320px' }}
    >
      {isVisible && !imageError ? (
        <img
          src={resolveImageSrc(item.thumbnailSrc)}
          alt={item.alt}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/5">
          <span className="text-4xl font-bold text-primary/20">{item.id}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-linear-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute bottom-0 left-0 right-0 p-4 text-primary-foreground">
          <p className="font-medium text-sm mb-1">{item.alt}</p>
          <p className="text-xs text-primary-foreground/70">{item.date}</p>
        </div>
      </div>
    </button>
  )
}

function Lightbox({
  item,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: {
  item: GalleryItem
  onClose: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}) {
  const [imageError, setImageError] = useState(false)

  return (
    <div
      className="fixed inset-0 z-50 bg-primary/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
        aria-label="Close lightbox"
      >
        <X className="w-6 h-6" />
      </button>

      {hasPrev && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onPrev()
          }}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {hasNext && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onNext()
          }}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-primary-foreground/10 flex items-center justify-center text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
          aria-label="Next image"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      <div
        className="relative max-w-4xl max-h-[80vh] w-full mx-6"
        onClick={(e) => e.stopPropagation()}
      >
        {!imageError ? (
          <img
            src={resolveImageSrc(item.src)}
            alt={item.alt}
            width={1200}
            height={800}
            className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full aspect-video flex items-center justify-center bg-primary-foreground/10 rounded-lg">
            <span className="text-6xl font-bold text-primary-foreground/30">{item.id}</span>
          </div>
        )}
        <div className="mt-4 text-center text-primary-foreground">
          <p className="font-medium text-lg">{item.alt}</p>
          <p className="text-sm text-primary-foreground/70 mt-1">
            {getItemCategories(item).join(', ')} &middot; {item.date}
          </p>
        </div>
      </div>
    </div>
  )
}

export function GalleryGrid() {
  const [activeCategory, setActiveCategory] = useState('전체')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const galleryItems = useMemo(
    () =>
      [...notionGalleryItems].sort((a, b) => {
        const dateDiff = parseDateToOrderValue(b) - parseDateToOrderValue(a)
        if (dateDiff !== 0) return dateDiff
        return b.id - a.id
      }),
    []
  )

  const categories = useMemo(
    () => ['전체', ...new Set(galleryItems.flatMap((item) => getItemCategories(item)))],
    [galleryItems]
  )

  const filteredItems =
    activeCategory === '전체'
      ? galleryItems
      : galleryItems.filter((item) => getItemCategories(item).includes(activeCategory))

  const selectedItem = selectedIndex !== null ? filteredItems[selectedIndex] : null

  return (
    <div>
      {/* Category Filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={cn(
              'px-5 py-2 rounded-full text-sm font-medium transition-all',
              activeCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredItems.map((item, index) => (
          <GalleryCard key={item.id} item={item} onClick={() => setSelectedIndex(index)} />
        ))}
      </div>

      {/* Lightbox */}
      {selectedItem && (
        <Lightbox
          item={selectedItem}
          onClose={() => setSelectedIndex(null)}
          onPrev={() => setSelectedIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
          onNext={() =>
            setSelectedIndex((prev) =>
              prev !== null && prev < filteredItems.length - 1 ? prev + 1 : prev
            )
          }
          hasPrev={selectedIndex !== null && selectedIndex > 0}
          hasNext={selectedIndex !== null && selectedIndex < filteredItems.length - 1}
        />
      )}
    </div>
  )
}
