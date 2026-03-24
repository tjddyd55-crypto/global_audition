'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { GalleryModal } from '@/components/gallery/GalleryModal'
import { applyGalleryImageOnError, GALLERY_IMAGE_FALLBACK_SRC } from '@/components/gallery/galleryFallback'
import { shouldTriggerSwipeNavigation } from '@/components/gallery/gallerySwipe'

export type AuditionGalleryProps = {
  /** 상세 페이지: 대표 이미지를 제외한 갤러리 URL만 (히어로와 중복 금지) */
  images: string[]
  /** grid: 풀폭 2열 썸네일 / slider: 단일 프리뷰 슬라이더 */
  layout?: 'slider' | 'grid'
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

function GalleryMainImage({ src, label }: { src: string; label: string }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoaded(false)
  }, [src])

  const finishLoad = useCallback(() => {
    setLoaded(true)
  }, [])

  return (
    <div className="relative z-0 flex h-full min-h-0 w-full min-w-0 items-center justify-center">
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
        className="relative z-[1] max-h-[min(75vh,640px)] w-auto max-w-full object-contain transition-opacity duration-200 data-[loaded=false]:opacity-0 data-[loaded=true]:opacity-100"
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

function GridThumb({
  src,
  index,
  onOpen,
}: {
  src: string
  index: number
  onOpen: (i: number) => void
}) {
  const [failed, setFailed] = useState(false)
  const url = failed ? GALLERY_IMAGE_FALLBACK_SRC : src

  return (
    <button
      type="button"
      className="relative aspect-square w-full overflow-hidden border-0 bg-black p-0"
      onClick={() => onOpen(index)}
      aria-label={`이미지 ${index + 1} 크게 보기`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        loading={index < 4 ? 'eager' : 'lazy'}
        onError={() => setFailed(true)}
      />
    </button>
  )
}

export default function AuditionGallery({ images, layout = 'slider' }: AuditionGalleryProps) {
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

  const openAt = useCallback((i: number) => {
    setCurrentIndex(i)
    setIsOpen(true)
  }, [])

  const current = allImages[currentIndex] ?? ''
  const canPrev = currentIndex > 0
  const canNext = currentIndex < allImages.length - 1

  const goPrev = useCallback((e?: MouseEvent) => {
    e?.stopPropagation()
    setCurrentIndex((i) => Math.max(0, i - 1))
  }, [])

  const goNext = useCallback(
    (e?: MouseEvent) => {
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
      <p className="m-0 px-4 py-2 text-sm text-gray-500 md:px-6">등록된 추가 이미지가 없습니다.</p>
    )
  }

  if (layout === 'grid') {
    return (
      <div className="w-full">
        <div className="grid w-full grid-cols-2 gap-1 bg-neutral-900 p-0">
          {allImages.map((src, i) => (
            <GridThumb key={`g-${i}-${src.slice(0, 24)}`} src={src} index={i} onOpen={openAt} />
          ))}
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

  return (
    <div className="w-full px-0">
      <div
        role="button"
        tabIndex={0}
        className="group relative flex w-full cursor-pointer flex-col overflow-hidden bg-black focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
      >
        <div
          className="flex min-h-[12rem] w-full max-h-[min(75vh,640px)] items-center justify-center px-2 py-3"
          onTouchStart={onMainTouchStart}
          onTouchEnd={onMainTouchEnd}
        >
          <GalleryMainImage src={current} label={`이미지 ${currentIndex + 1} / ${allImages.length}`} />
        </div>

        <div
          className="pointer-events-none absolute bottom-2 right-2 z-[2] rounded bg-black/60 px-2 py-1 text-sm tabular-nums text-white"
          aria-hidden
        >
          {currentIndex + 1} / {allImages.length}
        </div>

        {canPrev && (
          <button
            type="button"
            className="absolute left-1 top-1/2 z-[3] flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white opacity-100 transition-opacity md:left-2 md:opacity-0 md:group-hover:opacity-100"
            onClick={goPrev}
            aria-label="이전 이미지"
          >
            ‹
          </button>
        )}
        {canNext && (
          <button
            type="button"
            className="absolute right-1 top-1/2 z-[3] flex min-h-12 min-w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-2xl text-white opacity-100 transition-opacity md:right-2 md:opacity-0 md:group-hover:opacity-100"
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
