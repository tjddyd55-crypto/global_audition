'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { GalleryModal } from '@/components/gallery/GalleryModal'
import { applyGalleryImageOnError } from '@/components/gallery/galleryFallback'

/** `gap-2` (0.5rem) — 스크롤 스텝 계산용 */
const SLIDER_GAP_PX = 8

export type AuditionGalleryProps = {
  /** 상세 페이지: 대표 이미지를 제외한 갤러리 URL만 (히어로와 중복 금지) */
  images: string[]
}

function normalizeGalleryUrls(images: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const u of images) {
    const t = (u ?? '').trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out
}

export default function AuditionGallery({ images }: AuditionGalleryProps) {
  const allImages = useMemo(() => normalizeGalleryUrls(images), [images])
  const [modalIndex, setModalIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const openAt = useCallback((index: number) => {
    setModalIndex(index)
    setIsOpen(true)
  }, [])

  const handleScroll = useCallback(() => {
    const el = containerRef.current
    if (!el || allImages.length === 0) return

    const width = el.clientWidth
    const step = width * 0.85 + SLIDER_GAP_PX
    const index = Math.round(el.scrollLeft / step)
    const clamped = Math.max(0, Math.min(index, allImages.length - 1))
    setCurrentIndex(clamped)
  }, [allImages.length])

  if (allImages.length === 0) {
    return <p className="m-0 py-2 text-center text-sm text-gray-500">등록된 추가 이미지가 없습니다.</p>
  }

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="scrollbar-hide flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-4"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {allImages.map((src, i) => (
          <button
            key={`${i}-${src.slice(0, 32)}`}
            type="button"
            className="w-[85%] shrink-0 snap-center cursor-zoom-in border-0 bg-transparent p-0 text-left"
            onClick={() => openAt(i)}
            aria-label={`이미지 ${i + 1} 크게 보기`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt=""
              className="h-auto w-full rounded-lg object-cover"
              loading={i < 2 ? 'eager' : 'lazy'}
              draggable={false}
              onError={applyGalleryImageOnError}
            />
          </button>
        ))}
      </div>

      {allImages.length > 1 ? (
        <nav
          className="mb-3 mt-2 flex items-center justify-center gap-2"
          aria-label="추가 이미지 위치"
        >
          {allImages.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all duration-200 ${
                i === currentIndex ? 'scale-110 bg-gray-800' : 'bg-gray-300'
              }`}
              aria-current={i === currentIndex ? 'step' : undefined}
            />
          ))}
        </nav>
      ) : null}

      {isOpen && (
        <GalleryModal
          images={allImages}
          currentIndex={modalIndex}
          setCurrentIndex={setModalIndex}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
