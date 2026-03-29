'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { applyGalleryImageOnError, GALLERY_IMAGE_FALLBACK_SRC } from '@/components/gallery/galleryFallback'
import { stripImageUrlResizeParams } from '@/lib/utils/imageDisplayUrl'
import { shouldTriggerSwipeNavigation } from '@/components/gallery/gallerySwipe'

export type ImageViewerOverlayProps = {
  images: string[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onClose: () => void
  ariaLabel?: string
}

function preloadImageUrl(url: string | undefined): void {
  if (!url || url === GALLERY_IMAGE_FALLBACK_SRC) return
  const img = new Image()
  img.src = stripImageUrlResizeParams(url)
}

/**
 * 풀스크린 이미지 뷰어(검정 배경): 모바일 스와이프, PC 좌·우 이동, 인덱스 표시.
 */
export function ImageViewerOverlay({
  images,
  currentIndex,
  onIndexChange,
  onClose,
  ariaLabel = '이미지 확대 보기',
}: ImageViewerOverlayProps) {
  const touchStartX = useRef<number | null>(null)
  const touchStartTime = useRef<number | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const n = images.length
  const safeIndex = n === 0 ? 0 : Math.min(Math.max(0, currentIndex), n - 1)
  const current = images[safeIndex] ?? ''
  const displaySrc = stripImageUrlResizeParams(current)

  const [imgLoaded, setImgLoaded] = useState(false)
  useEffect(() => {
    setImgLoaded(false)
  }, [displaySrc])

  const goPrev = useCallback(() => {
    if (n <= 1) return
    onIndexChange((safeIndex - 1 + n) % n)
  }, [n, onIndexChange, safeIndex])

  const goNext = useCallback(() => {
    if (n <= 1) return
    onIndexChange((safeIndex + 1) % n)
  }, [n, onIndexChange, safeIndex])

  useEffect(() => {
    if (n === 0) return
    preloadImageUrl(images[(safeIndex + 1) % n])
    preloadImageUrl(images[(safeIndex - 1 + n) % n])
  }, [safeIndex, images, n])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
      }
      if (n <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [goPrev, goNext, n])

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null
    touchStartTime.current = typeof performance !== 'undefined' ? performance.now() : Date.now()
  }

  const onTouchEnd = (e: React.TouchEvent) => {
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

  if (n === 0 || !current) return null

  return (
    <div
      className="fixed inset-0 z-50 flex cursor-default flex-col bg-black"
      role="dialog"
      aria-modal
      aria-label={ariaLabel}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute right-4 top-4 z-[2] text-3xl leading-none text-white hover:opacity-90"
        aria-label="닫기"
      >
        ×
      </button>

      {n > 1 ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            className="absolute left-4 top-1/2 z-[2] hidden -translate-y-1/2 text-3xl text-white hover:opacity-90 md:block"
            aria-label="이전 이미지"
          >
            ←
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            className="absolute right-4 top-1/2 z-[2] hidden -translate-y-1/2 text-3xl text-white hover:opacity-90 md:block"
            aria-label="다음 이미지"
          >
            →
          </button>
        </>
      ) : null}

      <div
        className="flex min-h-0 flex-1 flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {!imgLoaded && (
            <div
              className="pointer-events-none absolute inset-8 rounded bg-neutral-800/80 animate-pulse"
              aria-hidden
            />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={displaySrc}
            src={displaySrc}
            alt=""
            loading="eager"
            fetchPriority="high"
            draggable={false}
            className="relative z-[1] max-h-full max-w-full object-contain data-[loaded=false]:opacity-0 data-[loaded=true]:opacity-100"
            data-loaded={imgLoaded}
            onLoad={() => setImgLoaded(true)}
            onError={(e) => {
              applyGalleryImageOnError(e)
              setImgLoaded(true)
            }}
          />
        </div>

        {n > 1 ? (
          <div
            className="flex shrink-0 flex-col items-center gap-2 py-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap justify-center gap-1.5" role="tablist" aria-label="이미지 선택">
              {images.map((_, i) => (
                <button
                  key={`viewer-dot-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === safeIndex}
                  aria-label={`${i + 1}번 이미지`}
                  className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
                    i === safeIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                  }`}
                  onClick={() => onIndexChange(i)}
                />
              ))}
            </div>
            <div className="tabular-nums text-sm text-white/90">
              {safeIndex + 1} / {n}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
