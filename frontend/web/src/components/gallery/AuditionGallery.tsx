'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { applyGalleryImageOnError } from '@/components/gallery/galleryFallback'
import { stripImageUrlResizeParams } from '@/lib/utils/imageDisplayUrl'

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

/** 데스크톱 카드 폭 + gap-4(1rem) — 스크롤 인덱스 계산용 */
const DESKTOP_GALLERY_CARD_PX = 300
const DESKTOP_GALLERY_GAP_PX = 16

/**
 * 모바일: 기존 풀폭 4:5 스냅 슬라이드(변경 없음).
 * PC: max-w 1280px 안에서 300px 카드 가로 스크롤 + snap-start.
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
    const step = DESKTOP_GALLERY_CARD_PX + DESKTOP_GALLERY_GAP_PX
    const idx = Math.round(el.scrollLeft / step)
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

  if (n === 0) {
    return <p className="m-0 py-2 text-center text-sm text-gray-500">등록된 추가 이미지가 없습니다.</p>
  }

  return (
    <div className="mx-auto w-full lg:max-w-[1280px]">
      <div className="lg:hidden">
        <div className="w-full overflow-hidden">
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
                  <div className="aspect-[4/5] w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="h-full w-full cursor-pointer object-cover"
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

      <div className="hidden lg:block w-full">
        <div
          ref={desktopTrackRef}
          role="region"
          aria-label="이미지 슬라이드"
          onScroll={onDesktopScroll}
          className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth [-webkit-overflow-scrolling:touch]"
        >
          {allImages.map((src, i) => {
            const url = stripImageUrlResizeParams(src)
            return (
              <div
                key={`d-${i}-${url.slice(0, 32)}`}
                className="w-[300px] shrink-0 snap-start"
              >
                <div className="aspect-[4/5] w-full overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full cursor-pointer object-cover"
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

      {n > 1 ? (
        <div className="mt-2 flex justify-center gap-1" aria-hidden>
          {allImages.map((_, i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full ${i === currentIndex ? 'bg-black' : 'bg-gray-300'}`}
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
                  className="relative h-full w-full shrink-0 snap-center overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u}
                    alt=""
                    className="h-full w-full object-cover"
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
