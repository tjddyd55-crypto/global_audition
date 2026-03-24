'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type TouchEvent } from 'react'
import { GalleryModal } from '@/components/gallery/GalleryModal'
import { applyGalleryImageOnError, GALLERY_IMAGE_FALLBACK_SRC } from '@/components/gallery/galleryFallback'
import { shouldTriggerSwipeNavigation } from '@/components/gallery/gallerySwipe'

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

function preloadImageUrl(url: string | undefined): void {
  if (!url || url === GALLERY_IMAGE_FALLBACK_SRC) return
  const img = new Image()
  img.src = url
}

export default function AuditionGallery({ images }: AuditionGalleryProps) {
  const allImages = useMemo(() => normalizeGalleryUrls(images), [images])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchStartTime = useRef<number | null>(null)

  useEffect(() => {
    if (allImages.length === 0) return
    setCurrentIndex((prev) => Math.min(prev, allImages.length - 1))
  }, [allImages.length])

  useEffect(() => {
    const next = allImages[currentIndex + 1]
    const prev = allImages[currentIndex - 1]
    if (next) preloadImageUrl(next)
    if (prev) preloadImageUrl(prev)
  }, [currentIndex, allImages])

  const currentSrc = allImages[currentIndex] ?? ''
  const n = allImages.length

  const goPrev = useCallback(
    (e?: MouseEvent) => {
      e?.stopPropagation()
      if (n <= 1) return
      setCurrentIndex((i) => (i === 0 ? n - 1 : i - 1))
    },
    [n]
  )

  const goNext = useCallback(
    (e?: MouseEvent) => {
      e?.stopPropagation()
      if (n <= 1) return
      setCurrentIndex((i) => (i === n - 1 ? 0 : i + 1))
    },
    [n]
  )

  const onMainTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null
    touchStartTime.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  const onMainTouchEnd = (e: TouchEvent) => {
    const start = touchStartX.current
    const t0 = touchStartTime.current
    touchStartX.current = null
    touchStartTime.current = null
    if (start == null || t0 == null || n <= 1) return
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
    return <p className="m-0 py-2 text-center text-sm text-gray-500">등록된 추가 이미지가 없습니다.</p>
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        className="group relative h-[40vh] w-full cursor-pointer overflow-hidden bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={currentSrc}
          src={currentSrc}
          alt={`이미지 ${currentIndex + 1} / ${n}`}
          loading={currentIndex === 0 ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover object-center"
          onError={applyGalleryImageOnError}
        />

        <div
          className="pointer-events-none absolute bottom-2 right-3 z-[2] bg-black/60 px-2 py-1 text-sm tabular-nums text-white"
          aria-hidden
        >
          {currentIndex + 1} / {n}
        </div>

        {n > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 z-[3] flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center text-2xl text-white drop-shadow-md"
              onClick={goPrev}
              aria-label="이전 이미지"
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 z-[3] flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center text-2xl text-white drop-shadow-md"
              onClick={goNext}
              aria-label="다음 이미지"
            >
              ›
            </button>
          </>
        ) : null}
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
