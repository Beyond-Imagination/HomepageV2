import { useState } from "react"

import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface GalleryItem {
  id: number
  src: string
  alt: string
  category: string
  date: string
}

const categories = ["전체", "스터디", "해커톤", "네트워킹", "컨퍼런스"]

const galleryItems: GalleryItem[] = [
  {
    id: 1,
    src: "/images/gallery/study-01.jpg",
    alt: "주간 스터디 세션",
    category: "스터디",
    date: "2024.12",
  },
  {
    id: 2,
    src: "/images/gallery/hackathon-01.jpg",
    alt: "24시간 해커톤",
    category: "해커톤",
    date: "2024.11",
  },
  {
    id: 3,
    src: "/images/gallery/networking-01.jpg",
    alt: "개발자 네트워킹 데이",
    category: "네트워킹",
    date: "2024.10",
  },
  {
    id: 4,
    src: "/images/gallery/conference-01.jpg",
    alt: "기술 컨퍼런스 참가",
    category: "컨퍼런스",
    date: "2024.09",
  },
  {
    id: 5,
    src: "/images/gallery/study-02.jpg",
    alt: "알고리즘 스터디",
    category: "스터디",
    date: "2024.08",
  },
  {
    id: 6,
    src: "/images/gallery/hackathon-02.jpg",
    alt: "스타트업 해커톤 수상",
    category: "해커톤",
    date: "2024.07",
  },
  {
    id: 7,
    src: "/images/gallery/networking-02.jpg",
    alt: "연말 파티",
    category: "네트워킹",
    date: "2024.06",
  },
  {
    id: 8,
    src: "/images/gallery/conference-02.jpg",
    alt: "AWS Summit 참가",
    category: "컨퍼런스",
    date: "2024.05",
  },
  {
    id: 9,
    src: "/images/gallery/study-03.jpg",
    alt: "시스템 디자인 스터디",
    category: "스터디",
    date: "2024.04",
  },
]

function GalleryCard({
  item,
  onClick
}: {
  item: GalleryItem
  onClick: () => void
}) {
  const [imageError, setImageError] = useState(false)

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-square overflow-hidden rounded-xl bg-secondary cursor-pointer"
    >
      {!imageError ? (
        <img
          src={item.src || "/placeholder.svg"}
          alt={item.alt}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/5">
          <span className="text-4xl font-bold text-primary/20">{item.id}</span>
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
  hasNext
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
            src={item.src || "/placeholder.svg"}
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
            {item.category} &middot; {item.date}
          </p>
        </div>
      </div>
    </div>
  )
}

export function GalleryGrid() {
  const [activeCategory, setActiveCategory] = useState("전체")
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const filteredItems = activeCategory === "전체"
    ? galleryItems
    : galleryItems.filter(item => item.category === activeCategory)

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
              "px-5 py-2 rounded-full text-sm font-medium transition-all",
              activeCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filteredItems.map((item, index) => (
          <GalleryCard
            key={item.id}
            item={item}
            onClick={() => setSelectedIndex(index)}
          />
        ))}
      </div>

      {/* Lightbox */}
      {selectedItem && (
        <Lightbox
          item={selectedItem}
          onClose={() => setSelectedIndex(null)}
          onPrev={() => setSelectedIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev)}
          onNext={() => setSelectedIndex(prev => prev !== null && prev < filteredItems.length - 1 ? prev + 1 : prev)}
          hasPrev={selectedIndex !== null && selectedIndex > 0}
          hasNext={selectedIndex !== null && selectedIndex < filteredItems.length - 1}
        />
      )}
    </div>
  )
}
