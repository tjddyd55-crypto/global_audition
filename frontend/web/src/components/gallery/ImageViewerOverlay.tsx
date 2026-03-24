'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { applyGalleryImageOnError, GALLERY_IMAGE_FALLBACK_SRC } from '@/components/gallery/galleryFallback'
import { shouldTriggerSwipeNavigation } from '@/components/gallery/gallerySwipe'

export type ImageViewerOverlayProps = {
  images: string[]
  currentIndex: number
  onIndexChange: (index: number) => void
  onClose: () => void
  /** dialog 접근성 라벨 */
  ariaLabel?: string
}

function preloadImageUrl(url: string | undefined): void {
  if (!url || url === GALLERY_IMAGE_FALLBACK_SRC) return
  const img = new Image()
  img.src = url
}

function ViewerImage({ src, label }: { src: string; label: string }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [src])

  const finishLoad = useCallback(() => setLoaded(true), [])

  return (
    <div className="relative flex max-h-[85vh] w-full max-w-[min(100vw-2rem,1200px)] items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 z-0 min-h-[30vh] rounded bg-gray-800/80 animate-pulse" aria-hidden />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={label}
        loading="eager"
        fetchPriority="high"
        draggable={false}
        className="relative z-[1] max-h-[85vh] w-auto max-w-full object-contain transition-opacity duration-200 data-[loaded=false]:opacity-0 data-[loaded=true]:opacity-100"
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

/**
 * 풀스크린 이미지 뷰어: 세로·가로 contain, 스와이프, PC 좌우 버튼, 인덱스·도트, 순환 네비.
 * 오디션 갤러리 / 프로필 등 공통 사용.
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

  const goPrev = useCallback(() => {
    if (n <= 1) return
    onIndexChange(safeIndex === 0 ? n - 1 : safeIndex - 1)
  }, [n, onIndexChange, safeIndex])

  const goNext = useCallback(() => {
    if (n <= 1) return
    onIndexChange(safeIndex >= n - 1 ? 0 : safeIndex + 1)
  }, [n, onIndexChange, safeIndex])

  useEffect(() => {
    if (n === 0) return
    const nextIdx = (safeIndex + 1) % n
    const prevIdx = (safeIndex - 1 + n) % n
    preloadImageUrl(images[nextIdx])
    preloadImageUrl(images[prevIdx])
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
      className="fixed inset-0 z-[9999] flex cursor-default items-center justify-center bg-black p-4"
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
        className="absolute right-3 top-3 z-[10002] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20 md:right-4 md:top-4"
        aria-label="닫기"
      >
        ×
      </button>

      {n > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            className="absolute left-1 z-[10002] hidden min-h-12 min-w-12 rounded-full bg-white/10 text-3xl text-white hover:bg-white/20 md:left-4 md:flex md:items-center md:justify-center md:px-4 md:py-6"
            aria-label="이전 이미지"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goNext()
            }}
            className="absolute right-1 z-[10002] hidden min-h-12 min-w-12 rounded-full bg-white/10 text-3xl text-white hover:bg-white/20 md:right-4 md:flex md:items-center md:justify-center md:px-4 md:py-6"
            aria-label="다음 이미지"
          >
            ›
          </button>
        </>
      )}

      <div
        className="relative flex w-full max-w-5xl flex-col items-center"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ViewerImage src={current} label={`이미지 ${safeIndex + 1} / ${n}`} />

        <div className="mt-3 flex w-full flex-col items-center gap-2">
          {n > 1 && (
            <div className="flex max-w-full flex-wrap justify-center gap-1.5 px-2" role="tablist" aria-label="이미지 선택">
              {images.map((_, i) => (
                <button
                  key={`viewer-dot-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === safeIndex}
                  aria-label={`${i + 1}번 이미지`}
                  className={`h-2 w-2 shrink-0 rounded-full transition-colors ${
                    i === safeIndex ? 'bg-white' : 'bg-white/35 hover:bg-white/55'
                  }`}
                  onClick={() => onIndexChange(i)}
                />
              ))}
            </div>
          )}
          <div className="tabular-nums text-sm text-white/90">
            {safeIndex + 1} / {n}
          </div>
        </div>
      </div>
    </div>
  )
}
