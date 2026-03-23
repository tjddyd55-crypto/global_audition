'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { applyGalleryImageOnError, GALLERY_IMAGE_FALLBACK_SRC } from '@/components/gallery/galleryFallback'
import { shouldTriggerSwipeNavigation } from '@/components/gallery/gallerySwipe'

export type GalleryModalProps = {
  images: string[]
  currentIndex: number
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
  onClose: () => void
}

function preloadImageUrl(url: string | undefined): void {
  if (!url || url === GALLERY_IMAGE_FALLBACK_SRC) return
  const img = new Image()
  img.src = url
}

function ModalImageInner({ src, label }: { src: string; label: string }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [src])

  const finishLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center">
      {!loaded && (
        <div
          className="absolute inset-0 z-[0] min-h-[40vh] min-w-[50vw] rounded bg-gray-200 animate-pulse md:min-h-[50vh]"
          aria-hidden
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={label}
        loading="eager"
        fetchPriority="high"
        className="relative z-[1] max-h-[90vh] max-w-[90vw] select-none object-contain transition-opacity duration-200 data-[loaded=false]:opacity-0 data-[loaded=true]:opacity-100"
        data-loaded={loaded}
        draggable={false}
        onLoad={finishLoad}
        onError={(e) => {
          applyGalleryImageOnError(e)
          finishLoad()
        }}
      />
    </div>
  )
}

export function GalleryModal({ images, currentIndex, setCurrentIndex, onClose }: GalleryModalProps) {
  const touchStartX = useRef<number | null>(null)
  const touchStartTime = useRef<number | null>(null)

  useEffect(() => {
    const next = images[currentIndex + 1]
    const prev = images[currentIndex - 1]
    if (next) preloadImageUrl(next)
    if (prev) preloadImageUrl(prev)
  }, [currentIndex, images])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentIndex((i) => Math.max(0, i - 1))
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentIndex((i) => Math.min(images.length - 1, i + 1))
      }
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [images.length, onClose, setCurrentIndex])

  const goPrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      setCurrentIndex((i) => Math.max(0, i - 1))
    },
    [setCurrentIndex]
  )

  const goNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      setCurrentIndex((i) => Math.min(images.length - 1, i + 1))
    },
    [images.length, setCurrentIndex]
  )

  const current = images[currentIndex] ?? ''

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null
    touchStartTime.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  const onTouchEnd = (e: React.TouchEvent) => {
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

  if (images.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-default items-center justify-center bg-black/90"
      role="dialog"
      aria-modal
      aria-label="이미지 확대 보기"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute right-3 top-3 z-[102] flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-2xl text-white md:h-10 md:w-10"
        aria-label="닫기"
      >
        ×
      </button>

      {currentIndex > 0 && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-2 z-[102] flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/50 text-3xl text-white md:left-6 md:min-h-0 md:min-w-0 md:px-4 md:py-6"
          aria-label="이전 이미지"
        >
          ‹
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-2 z-[102] flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/50 text-3xl text-white md:right-6 md:min-h-0 md:min-w-0 md:px-4 md:py-6"
          aria-label="다음 이미지"
        >
          ›
        </button>
      )}

      <div
        className="relative flex max-h-full max-w-full items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ModalImageInner src={current} label={`이미지 ${currentIndex + 1} / ${images.length}`} />
      </div>

      <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center tabular-nums text-sm text-white/90">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}
