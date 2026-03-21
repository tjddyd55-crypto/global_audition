'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { TEXT_SUB } from '@/lib/ui/specClasses'

type Props = {
  images: string[]
}

function preloadUrl(url: string | undefined) {
  if (!url || typeof window === 'undefined') return
  const img = new window.Image()
  img.src = url
}

/**
 * 가로 스크롤 + snap (스펙: snap-x snap-mandatory), 탭 시 전체 화면 모달.
 */
export function AuditionGalleryViewer({ images }: Props) {
  const [modalIndex, setModalIndex] = useState<number | null>(null)
  const [stripIndex, setStripIndex] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const close = useCallback(() => setModalIndex(null), [])
  const goPrev = useCallback(() => {
    setModalIndex((i) => (i !== null && i > 0 ? i - 1 : i))
  }, [])
  const goNext = useCallback(() => {
    setModalIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i))
  }, [images.length])

  const updateStripIndexFromScroll = useCallback(() => {
    const root = scrollerRef.current
    if (!root || images.length === 0) return
    const mid = root.scrollLeft + root.clientWidth / 2
    const children = Array.from(root.children) as HTMLElement[]
    let best = 0
    let bestDist = Infinity
    children.forEach((ch, i) => {
      const cMid = ch.offsetLeft + ch.offsetWidth / 2
      const d = Math.abs(cMid - mid)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    setStripIndex(Math.min(best, images.length - 1))
  }, [images.length])

  useEffect(() => {
    const root = scrollerRef.current
    if (!root) return
    updateStripIndexFromScroll()
    root.addEventListener('scroll', updateStripIndexFromScroll, { passive: true })
    return () => root.removeEventListener('scroll', updateStripIndexFromScroll)
  }, [images.length, updateStripIndexFromScroll])

  useEffect(() => {
    const next = images[stripIndex + 1]
    if (next) preloadUrl(next)
    const prev = images[stripIndex - 1]
    if (prev) preloadUrl(prev)
  }, [stripIndex, images])

  useEffect(() => {
    if (modalIndex === null) return
    const next = images[modalIndex + 1]
    if (next) preloadUrl(next)
    const prev = images[modalIndex - 1]
    if (prev) preloadUrl(prev)
  }, [modalIndex, images])

  useEffect(() => {
    if (modalIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [modalIndex, close, goPrev, goNext])

  const onModalTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null
  }

  const onModalTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null || modalIndex === null) return
    const end = e.changedTouches[0]?.clientX
    if (end == null) return
    const dx = end - start
    const threshold = 48
    if (dx > threshold) goPrev()
    else if (dx < -threshold) goNext()
  }

  if (images.length === 0) return null

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 touch-pan-x [-webkit-overflow-scrolling:touch]"
      >
        {images.map((src, i) => (
          <button
            key={`g-strip-${i}-${src.slice(0, 24)}`}
            type="button"
            onClick={() => setModalIndex(i)}
            className="relative aspect-[4/3] w-[min(280px,85vw)] shrink-0 snap-center cursor-pointer overflow-hidden rounded-[10px] border-0 bg-gray-100 p-0"
          >
            <Image src={src} alt="" fill sizes="280px" className="object-cover" unoptimized />
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-col items-center gap-2">
        <div className="flex justify-center gap-1.5" aria-hidden>
          {images.map((_, i) => (
            <span
              key={`dot-${i}`}
              className={`rounded-full transition-all duration-200 ${
                i === stripIndex ? 'h-1.5 w-[18px] bg-[#7c3aed]' : 'h-1.5 w-1.5 bg-black/20'
              }`}
            />
          ))}
        </div>
        <span className={`tabular-nums ${TEXT_SUB}`}>
          {stripIndex + 1} / {images.length}
        </span>
      </div>

      {modalIndex !== null && (
        <div
          className="fixed inset-0 z-[100] flex cursor-default items-center justify-center bg-black/90"
          role="dialog"
          onClick={close}
          aria-modal
          aria-label="갤러리"
        >
          <button
            type="button"
            onClick={close}
            className="absolute right-4 top-4 z-[102] flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-2xl font-light text-white"
            aria-label="닫기"
          >
            ×
          </button>
          {modalIndex > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 z-[102] rounded-full bg-black/35 px-3 py-4 text-3xl text-white md:left-6"
              aria-label="이전"
            >
              ‹
            </button>
          )}
          {modalIndex < images.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 z-[102] rounded-full bg-black/35 px-3 py-4 text-3xl text-white md:right-6"
              aria-label="다음"
            >
              ›
            </button>
          )}
          <div
            className="relative mx-4 h-[min(85vh,100%)] w-full max-w-5xl touch-pan-x"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={onModalTouchStart}
            onTouchEnd={onModalTouchEnd}
          >
            <Image
              src={images[modalIndex]}
              alt=""
              fill
              className="object-contain"
              priority
              unoptimized
            />
          </div>
          <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center tabular-nums text-sm text-white/90">
            {modalIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  )
}
