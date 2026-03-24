'use client'

import { useCallback, useMemo, useState } from 'react'
import { GalleryModal } from '@/components/gallery/GalleryModal'
import { applyGalleryImageOnError } from '@/components/gallery/galleryFallback'

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

  const openAt = useCallback((index: number) => {
    setModalIndex(index)
    setIsOpen(true)
  }, [])

  if (allImages.length === 0) {
    return <p className="m-0 py-2 text-center text-sm text-gray-500">등록된 추가 이미지가 없습니다.</p>
  }

  return (
    <div className="w-full">
      <div
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
