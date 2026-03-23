'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GalleryModal } from '@/components/gallery/GalleryModal'
import { applyGalleryImageOnError, GALLERY_IMAGE_FALLBACK_SRC } from '@/components/gallery/galleryFallback'
import { shouldTriggerSwipeNavigation } from '@/components/gallery/gallerySwipe'

export type AuditionGalleryProps = {
  coverImage: string
  /** 대표와 중복 제외된 갤러리 URL 목록 (상세 페이지 SSOT와 동일하게 넘기면 됨) */
  images?: string[]
}

function buildAllImages(coverImage: string, images: string[] | undefined): string[] {
  const cover = coverImage.trim()
  const rest = (images ?? []).map((u) => u.trim()).filter(Boolean)
  const galleryOnly = cover ? rest.filter((u) => u !== cover) : rest
  return cover ? [cover, ...galleryOnly] : galleryOnly
}

function preloadImageUrl(url: string | undefined): void {
  if (!url || url === GALLERY_IMAGE_FALLBACK_SRC) return
  const img = new Image()
  img.src = url
}

function GalleryMainImage({ src, label }: { src: string; label: string }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [src])

  const finishLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="relative z-0 flex h-full w-full min-h-0 min-w-0 items-center justify-center">
      {!loaded && (
        <div
          className="absolute inset-0 z-[0] rounded bg-gray-200 animate-pulse"
          aria-hidden
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={label}
        loading="lazy"
        className="relative z-[1] max-h-full max-w-full object-contain transition-opacity duration-200 data-[loaded=false]:opacity-0 data-[loaded=true]:opacity-100"
        data-loaded={loaded}
        onLoad={finishLoad}
        onError={(e) => {
          applyGalleryImageOnError(e)
          finishLoad()
        }}
      />
    </div>
  )
}

export default function AuditionGallery({ coverImage, images = [] }: AuditionGalleryProps) {
  const allImages = useMemo(() => buildAllImages(coverImage, images), [coverImage, images])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartTime = useRef<number | null>(null)

  useEffect(() => {
    if (allImages.length === 0) return
    setCurrentIndex((prev) => Math.min(prev, allImages.length - 1))
  }, [allImages.length])

  /** 인접 슬라이드 프리로드 (이전·다음) */
  useEffect(() => {
    const next = allImages[currentIndex + 1]
    const prev = allImages[currentIndex - 1]
    if (next) preloadImageUrl(next)
    if (prev) preloadImageUrl(prev)
  }, [currentIndex, allImages])

  const current = allImages[currentIndex] ?? ''
  const canPrev = currentIndex > 0
  const canNext = currentIndex < allImages.length - 1

  const goPrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      setCurrentIndex((i) => Math.min(allImages.length - 1, i + 1))
    },
    [allImages.length]
  )

  const onMainTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null
    touchStartTime.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  const onMainTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current
    const t0 = touchStartTime.current
    touchStartX.current = null
    touchStartTime.current = null
    if (start == null || t0 == null) return
    const end = e.changedTouches[0]?.clientX
    if (end == null) return
    const deltaX = end - start
    const t1 = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const durationMs = Math.max(1, t1 - t0)

    const nav = shouldTriggerSwipeNavigation(deltaX, durationMs)
    if (nav === 'prev') goPrev()
    else if (nav === 'next') goNext()
  }

  if (allImages.length === 0) {
    return (
      <p className="m-0 text-sm text-gray-500">등록된 이미지가 없습니다.</p>
    )
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        className="group relative flex w-full cursor-pointer items-center justify-center bg-black aspect-[16/9]"
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
        onTouchStart={onMainTouchStart}
        onTouchEnd={onMainTouchEnd}
      >
        <GalleryMainImage src={current} label={`이미지 ${currentIndex + 1} / ${allImages.length}`} />

        <div
          className="pointer-events-none absolute bottom-2 right-2 z-[2] rounded bg-black/60 px-2 py-1 text-sm tabular-nums text-white"
          aria-hidden
        >
          {currentIndex + 1} / {allImages.length}
        </div>

        {canPrev && (
          <button
            type="button"
            className="absolute left-1 z-[1] flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/50 text-2xl text-white opacity-100 transition-opacity md:left-2 md:opacity-0 md:group-hover:opacity-100"
            onClick={goPrev}
            aria-label="이전 이미지"
          >
            ‹
          </button>
        )}
        {canNext && (
          <button
            type="button"
            className="absolute right-1 z-[1] flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/50 text-2xl text-white opacity-100 transition-opacity md:right-2 md:opacity-0 md:group-hover:opacity-100"
            onClick={goNext}
            aria-label="다음 이미지"
          >
            ›
          </button>
        )}
      </div>

      {isOpen && (
        <GalleryModal
          images={allImages}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
