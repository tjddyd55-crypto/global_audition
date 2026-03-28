'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { GalleryModal } from '@/components/gallery/GalleryModal'
import { applyGalleryImageOnError } from '@/components/gallery/galleryFallback'

/** `gap: 16px` — 스텝·스크롤 계산용 */
const SLIDER_GAP_PX = 16
const DRAG_CLICK_THRESHOLD_PX = 8

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
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const trackRef = useRef<HTMLDivElement | null>(null)
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startScroll: 0,
    maxDelta: 0,
  })
  const suppressNextClickRef = useRef(false)

  const openAt = useCallback((index: number) => {
    setModalIndex(index)
    setIsOpen(true)
  }, [])

  const updateScrollChrome = useCallback(() => {
    const el = trackRef.current
    if (!el) {
      setCanScrollPrev(false)
      setCanScrollNext(false)
      return
    }
    const max = el.scrollWidth - el.clientWidth
    if (max <= 1) {
      setCanScrollPrev(false)
      setCanScrollNext(false)
      return
    }
    setCanScrollPrev(el.scrollLeft > 2)
    setCanScrollNext(el.scrollLeft < max - 2)
  }, [])

  const handleScroll = useCallback(() => {
    const el = trackRef.current
    if (!el || allImages.length === 0) return

    const width = el.clientWidth
    const step = width * 0.85 + SLIDER_GAP_PX
    const index = Math.round(el.scrollLeft / step)
    const clamped = Math.max(0, Math.min(index, allImages.length - 1))
    setCurrentIndex(clamped)
    updateScrollChrome()
  }, [allImages.length, updateScrollChrome])

  const scrollStepPx = useCallback(() => {
    const el = trackRef.current
    if (!el) return 320
    return el.clientWidth * 0.85 + SLIDER_GAP_PX
  }, [])

  const scrollPrev = useCallback(() => {
    trackRef.current?.scrollBy({ left: -scrollStepPx(), behavior: 'smooth' })
  }, [scrollStepPx])

  const scrollNext = useCallback(() => {
    trackRef.current?.scrollBy({ left: scrollStepPx(), behavior: 'smooth' })
  }, [scrollStepPx])

  /** PC: 세로 휠 → 가로 scrollLeft */
  useEffect(() => {
    const el = trackRef.current
    if (!el || allImages.length === 0) return

    const onWheel = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return
      const dy = e.deltaY
      const dx = e.deltaX
      if (Math.abs(dy) < Math.abs(dx)) return
      if (Math.abs(dy) < 1) return
      e.preventDefault()
      el.scrollLeft += dy
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [allImages.length])

  /** 마우스 드래그로 가로 스크롤 */
  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const s = dragRef.current
      if (!s.active || e.pointerId !== s.pointerId) return
      const el = trackRef.current
      if (!el) return
      const delta = e.clientX - s.startX
      s.maxDelta = Math.max(s.maxDelta, Math.abs(delta))
      el.scrollLeft = s.startScroll - delta
    }

    const onPointerUp = (e: PointerEvent) => {
      const s = dragRef.current
      if (!s.active || e.pointerId !== s.pointerId) return
      s.active = false
      if (s.maxDelta > DRAG_CLICK_THRESHOLD_PX) {
        suppressNextClickRef.current = true
      }
      try {
        trackRef.current?.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
    }

    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

  const bumpScrollChrome = useCallback(() => {
    requestAnimationFrame(() => updateScrollChrome())
  }, [updateScrollChrome])

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    updateScrollChrome()
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateScrollChrome) : null
    ro?.observe(el)
    return () => ro?.disconnect()
  }, [allImages.length, updateScrollChrome])

  const onTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    if (e.button !== 0) return
    const el = trackRef.current
    if (!el) return
    dragRef.current = {
      active: true,
      pointerId: e.pointerId,
      startX: e.clientX,
      startScroll: el.scrollLeft,
      maxDelta: 0,
    }
    try {
      el.setPointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }

  const onImageActivate = (i: number) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }
    openAt(i)
  }

  const navBtnClass =
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-lg font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-35'

  if (allImages.length === 0) {
    return <p className="m-0 py-2 text-center text-sm text-gray-500">등록된 추가 이미지가 없습니다.</p>
  }

  const showArrows = allImages.length > 1

  return (
    <div className="gallery-container w-full">
      <div className="flex w-full min-w-0 max-w-full items-center gap-2">
        {showArrows ? (
          <button type="button" className={navBtnClass} aria-label="이전 이미지" onClick={scrollPrev} disabled={!canScrollPrev}>
            ←
          </button>
        ) : null}

        <div
          ref={trackRef}
          role="region"
          aria-label="추가 이미지 갤러리"
          onScroll={handleScroll}
          onPointerDown={onTrackPointerDown}
          className="gallery-track max-w-full min-w-0 flex-1 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {allImages.map((src, i) => (
            <button
              key={`${i}-${src.slice(0, 32)}`}
              type="button"
              className="w-[85%] max-w-[85%] shrink-0 snap-center cursor-zoom-in border-0 bg-transparent p-0 text-left"
              onClick={() => onImageActivate(i)}
              aria-label={`이미지 ${i + 1} 크게 보기`}
            >
              <div className="image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt=""
                  loading={i < 2 ? 'eager' : 'lazy'}
                  draggable={false}
                  onLoad={bumpScrollChrome}
                  onError={applyGalleryImageOnError}
                />
              </div>
            </button>
          ))}
        </div>

        {showArrows ? (
          <button type="button" className={navBtnClass} aria-label="다음 이미지" onClick={scrollNext} disabled={!canScrollNext}>
            →
          </button>
        ) : null}
      </div>

      {allImages.length > 1 ? (
        <nav className="mb-3 mt-2 flex items-center justify-center gap-2" aria-label="추가 이미지 위치">
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
