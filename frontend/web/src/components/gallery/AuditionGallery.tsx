'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyGalleryImageOnError } from '@/components/gallery/galleryFallback'
import { stripImageUrlResizeParams } from '@/shared/utils/imageDisplayUrl'

export type AuditionGalleryProps = {
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

/**
 * 모바일: 피드형 슬라이드(globals `audition-detail-gallery-slide-wrap`만). PC: 동일 높이·cover + 중앙 max-width(별도 modifier).
 * 클릭 시 라이트박스 `.fullscreen-image` contain.
 */
export default function AuditionGallery({ images }: AuditionGalleryProps) {
  const allImages = useMemo(() => normalizeGalleryUrls(images), [images])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [viewerOpen, setViewerOpen] = useState(false)
  /** 라이트박스를 연 슬라이드 인덱스(메인 트랙 `currentIndex`와 별도) */
  const [viewerEntryIndex, setViewerEntryIndex] = useState(0)
  const mobileTrackRef = useRef<HTMLDivElement | null>(null)
  const desktopTrackRef = useRef<HTMLDivElement | null>(null)
  const lightboxTrackRef = useRef<HTMLDivElement | null>(null)
  const viewerOpenRef = useRef(false)

  const n = allImages.length

  useEffect(() => {
    viewerOpenRef.current = viewerOpen
  }, [viewerOpen])

  const closeLightbox = useCallback(() => {
    viewerOpenRef.current = false
    setViewerOpen(false)
    if (typeof window === 'undefined') return
    const st = window.history.state as { viewer?: boolean } | null
    if (st?.viewer) {
      window.history.back()
    }
  }, [])

  const openLightbox = useCallback((index: number) => {
    setViewerEntryIndex(index)
    viewerOpenRef.current = true
    setViewerOpen(true)
    if (typeof window !== 'undefined') {
      window.history.pushState({ viewer: true }, '')
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      if (viewerOpenRef.current) {
        viewerOpenRef.current = false
        setViewerOpen(false)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const onMobileScroll = useCallback(() => {
    const el = mobileTrackRef.current
    if (!el || n === 0) return
    const w = el.clientWidth
    if (w <= 0) return
    const idx = Math.round(el.scrollLeft / w)
    setCurrentIndex(Math.min(Math.max(0, idx), n - 1))
  }, [n])

  const onDesktopScroll = useCallback(() => {
    const el = desktopTrackRef.current
    if (!el || n === 0) return
    const w = el.clientWidth
    if (w <= 0) return
    const idx = Math.round(el.scrollLeft / w)
    setCurrentIndex(Math.min(Math.max(0, idx), n - 1))
  }, [n])

  useEffect(() => {
    const el = mobileTrackRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => onMobileScroll())
    ro.observe(el)
    return () => ro.disconnect()
  }, [onMobileScroll, n])

  useEffect(() => {
    const el = desktopTrackRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => onDesktopScroll())
    ro.observe(el)
    return () => ro.disconnect()
  }, [onDesktopScroll, n])

  useEffect(() => {
    if (!viewerOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeLightbox()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [viewerOpen, closeLightbox])

  useEffect(() => {
    if (!viewerOpen) return
    const el = lightboxTrackRef.current
    if (!el) return
    const w = el.clientWidth
    if (w <= 0) return
    const scrollToEntry = () => {
      el.scrollTo({ left: viewerEntryIndex * w, behavior: 'auto' })
    }
    scrollToEntry()
    requestAnimationFrame(scrollToEntry)
  }, [viewerOpen, viewerEntryIndex])

  /** PC 트랙: 세로 휠 → 가로 스크롤. 모바일 트랙에는 연결하지 않음. */
  useEffect(() => {
    const el = desktopTrackRef.current
    if (!el || n <= 1) return
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [n])

  const scrollGalleryToIndex = useCallback(
    (index: number) => {
      const clamped = Math.min(Math.max(0, index), n - 1)
      if (typeof window === 'undefined') return
      const isMd = window.matchMedia('(min-width: 768px)').matches
      const el = isMd ? desktopTrackRef.current : mobileTrackRef.current
      if (!el) return
      const w = el.clientWidth
      if (w <= 0) return
      el.scrollTo({ left: clamped * w, behavior: 'smooth' })
      setCurrentIndex(clamped)
    },
    [n],
  )

  if (n === 0) {
    return <p className="m-0 py-2 text-center text-sm text-gray-500">등록된 추가 이미지가 없습니다.</p>
  }

  return (
    <div className="mx-auto w-full max-w-full md:max-w-[1280px]">
      <div className="md:hidden">
        <div className="gallery-container w-full">
          <div
            ref={mobileTrackRef}
            role="region"
            aria-label="이미지 슬라이드"
            onScroll={onMobileScroll}
            className="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-webkit-overflow-scrolling:touch]"
          >
            {allImages.map((src, i) => {
              const url = stripImageUrlResizeParams(src)
              return (
                <div
                  key={`m-${i}-${url.slice(0, 32)}`}
                  className="min-w-full shrink-0 snap-center"
                >
                  <div className="audition-detail-gallery-slide-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="cursor-pointer"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      draggable={false}
                      onError={applyGalleryImageOnError}
                      onClick={() => openLightbox(i)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="relative hidden w-full md:block">
        {n > 1 ? (
          <>
            <button
              type="button"
              className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border-0 bg-black/50 px-2 py-3 text-2xl leading-none text-white hover:bg-black/70"
              aria-label="이전 이미지"
              onClick={() => scrollGalleryToIndex(currentIndex - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border-0 bg-black/50 px-2 py-3 text-2xl leading-none text-white hover:bg-black/70"
              aria-label="다음 이미지"
              onClick={() => scrollGalleryToIndex(currentIndex + 1)}
            >
              ›
            </button>
          </>
        ) : null}
        <div className="gallery-container gallery-container--desktop w-full min-w-0">
          <div
            ref={desktopTrackRef}
            role="region"
            aria-label="이미지 슬라이드"
            onScroll={onDesktopScroll}
            className="scrollbar-hide flex min-h-0 min-w-0 w-full snap-x snap-mandatory overflow-x-auto scroll-smooth overscroll-x-contain [-webkit-overflow-scrolling:touch]"
          >
            {allImages.map((src, i) => {
              const url = stripImageUrlResizeParams(src)
              return (
                <div
                  key={`d-${i}-${url.slice(0, 32)}`}
                  className="flex min-h-0 min-w-full shrink-0 snap-center justify-center bg-black"
                >
                  <div className="audition-detail-gallery-slide-wrap audition-detail-gallery-slide--pc">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="cursor-pointer"
                      loading={i === 0 ? 'eager' : 'lazy'}
                      draggable={false}
                      onError={applyGalleryImageOnError}
                      onClick={() => openLightbox(i)}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {n > 1 ? (
        <div className="mt-2 flex justify-center gap-1" role="tablist" aria-label="이미지 위치">
          {allImages.map((_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === currentIndex}
              aria-label={`이미지 ${i + 1}로 이동`}
              className={`h-2 w-2 shrink-0 rounded-full border-0 p-0 ${i === currentIndex ? 'bg-black' : 'bg-gray-300'}`}
              onClick={() => scrollGalleryToIndex(i)}
            />
          ))}
        </div>
      ) : null}

      {viewerOpen ? (
        <div className="fixed inset-0 z-50 bg-black">
          <button
            type="button"
            className="absolute right-4 top-4 z-50 border-0 bg-transparent text-xl text-white"
            onClick={closeLightbox}
            aria-label="전체화면 닫기"
          >
            ✕
          </button>

          <div
            ref={lightboxTrackRef}
            className="scrollbar-hide flex h-full w-full snap-x snap-mandatory overflow-x-auto [-webkit-overflow-scrolling:touch]"
          >
            {allImages.map((src, index) => {
              const u = stripImageUrlResizeParams(src)
              return (
                <div
                  key={`lb-${index}-${u.slice(0, 32)}`}
                  className="flex h-full w-full shrink-0 snap-center items-center justify-center overflow-auto p-4"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u}
                    alt=""
                    className="fullscreen-image"
                    draggable={false}
                    onError={applyGalleryImageOnError}
                  />
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
