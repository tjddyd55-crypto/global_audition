'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from 'react'
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

export default function AuditionGallery({ images }: AuditionGalleryProps) {
  const allImages = useMemo(() => normalizeGalleryUrls(images), [images])
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const touchStartXRef = useRef<number | null>(null)

  const n = allImages.length
  const safeIndex = n === 0 ? 0 : Math.min(Math.max(0, viewerIndex), n - 1)
  const currentSrc = allImages[safeIndex] ?? ''

  const openViewer = useCallback((i: number) => {
    if (n === 0) return
    setViewerIndex(Math.max(0, Math.min(i, n - 1)))
    setViewerOpen(true)
  }, [n])

  const closeViewer = useCallback(() => setViewerOpen(false), [])

  const goPrev = useCallback(() => {
    if (n <= 1) return
    setViewerIndex((i) => (i - 1 + n) % n)
  }, [n])

  const goNext = useCallback(() => {
    if (n <= 1) return
    setViewerIndex((i) => (i + 1) % n)
  }, [n])

  useEffect(() => {
    if (!viewerOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [viewerOpen])

  const closeRef = useRef(closeViewer)
  closeRef.current = closeViewer
  const goPrevRef = useRef(goPrev)
  goPrevRef.current = goPrev
  const goNextRef = useRef(goNext)
  goNextRef.current = goNext

  useEffect(() => {
    if (!viewerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current()
        return
      }
      if (n <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrevRef.current()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNextRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [viewerOpen, n])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const x = e.changedTouches[0]?.clientX
    touchStartXRef.current = x ?? null
  }, [])

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const startX = touchStartXRef.current
      touchStartXRef.current = null
      if (startX == null || n <= 1) return
      const endX = e.changedTouches[0]?.clientX
      if (endX === undefined) return
      const delta = endX - startX
      if (delta > 56) goPrev()
      else if (delta < -56) goNext()
    },
    [goNext, goPrev, n],
  )

  if (n === 0) {
    return <p className="m-0 py-2 text-center text-sm text-gray-500">등록된 추가 이미지가 없습니다.</p>
  }

  const displaySrc = stripImageUrlResizeParams(currentSrc)

  return (
    <div className="w-full">
      <div className="scrollbar-hide w-full overflow-x-auto">
        <div className="flex w-max gap-2">
          {allImages.map((src, i) => (
            <button
              key={`${i}-${src.slice(0, 32)}`}
              type="button"
              className="h-[100px] w-[30vw] shrink-0 cursor-pointer overflow-hidden rounded-md border-0 bg-neutral-200 p-0 text-left"
              onClick={() => openViewer(i)}
              aria-label={`이미지 ${i + 1} 크게 보기`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={stripImageUrlResizeParams(src)}
                alt=""
                className="h-full w-full object-cover"
                loading={i < 4 ? 'eager' : 'lazy'}
                draggable={false}
                onError={applyGalleryImageOnError}
              />
            </button>
          ))}
        </div>
      </div>

      {viewerOpen ? (
        <div
          className="fixed inset-0 z-50 flex h-full w-full flex-col bg-black"
          role="dialog"
          aria-modal={true}
          aria-label="갤러리 이미지 보기"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <button
            type="button"
            className="absolute right-4 top-4 z-[60] border-0 bg-transparent p-2 text-2xl leading-none text-white"
            onClick={closeViewer}
            aria-label="닫기"
          >
            ×
          </button>

          <button
            type="button"
            className="absolute left-4 top-1/2 z-[60] hidden -translate-y-1/2 border-0 bg-transparent p-2 text-3xl text-white md:block"
            onClick={goPrev}
            aria-label="이전 이미지"
            disabled={n <= 1}
          >
            ←
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 z-[60] hidden -translate-y-1/2 border-0 bg-transparent p-2 text-3xl text-white md:block"
            onClick={goNext}
            aria-label="다음 이미지"
            disabled={n <= 1}
          >
            →
          </button>

          <div className="flex h-full w-full flex-1 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displaySrc}
              alt=""
              className="max-h-full max-w-full object-contain"
              draggable={false}
              onError={applyGalleryImageOnError}
            />
          </div>

          <div className="pointer-events-none absolute bottom-16 left-0 right-0 flex justify-center gap-2">
            {allImages.map((_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i === safeIndex ? 'bg-white' : 'bg-white/35'}`}
                aria-hidden
              />
            ))}
          </div>

          <p className="pointer-events-none absolute bottom-6 left-0 right-0 m-0 text-center text-sm text-white">
            {safeIndex + 1} / {n}
          </p>
        </div>
      ) : null}
    </div>
  )
}
