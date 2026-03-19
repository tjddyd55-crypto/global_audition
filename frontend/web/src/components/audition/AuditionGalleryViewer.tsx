'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AUDITION_DETAIL, HERO } from '@/lib/design-tokens'

type Props = {
  images: string[]
}

function preloadUrl(url: string | undefined) {
  if (!url || typeof window === 'undefined') return
  const img = new window.Image()
  img.src = url
}

/**
 * 가로 스크롤 + snap, 탭 시 전체 화면 모달(좌우·닫기).
 * 스트립: 현재 인덱스 표시 + 다음 이미지 프리로드. design-tokens radius 사용.
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

  const thumbW = 'min(280px, 85vw)'

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="flex overflow-x-auto pb-2 -mx-1"
        style={{
          gap: AUDITION_DETAIL.galleryGapPx,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          // 가로 스냅 스크롤: pan-x 필수(pan-y만 주면 가로 스크롤이 막힘). 세로 페이지 스크롤은 부모에서 처리.
          touchAction: 'pan-x',
        }}
      >
        {images.map((src, i) => (
          <button
            key={`g-strip-${i}-${src.slice(0, 24)}`}
            type="button"
            onClick={() => setModalIndex(i)}
            className="relative shrink-0 overflow-hidden border-0 bg-gray-100 p-0 cursor-pointer"
            style={{
              width: thumbW,
              aspectRatio: '4/3',
              borderRadius: AUDITION_DETAIL.galleryRadiusPx,
              scrollSnapAlign: 'center',
            }}
          >
            <Image src={src} alt="" fill sizes="280px" className="object-cover" unoptimized />
          </button>
        ))}
      </div>

      <div
        className="mt-2 flex flex-col items-center gap-2"
        style={{ color: AUDITION_DETAIL.bodyColor, fontSize: AUDITION_DETAIL.bodyFontPx }}
      >
        <div className="flex justify-center gap-1.5" aria-hidden>
          {images.map((_, i) => (
            <span
              key={`dot-${i}`}
              className="rounded-full transition-[width,background-color] duration-200"
              style={{
                width: i === stripIndex ? 18 : 6,
                height: 6,
                backgroundColor: i === stripIndex ? HERO.primaryGradientStart : 'rgba(0,0,0,0.2)',
              }}
            />
          ))}
        </div>
        <span className="tabular-nums" style={{ fontSize: AUDITION_DETAIL.bodyFontPx }}>
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
            className="absolute right-4 top-4 z-[102] flex h-10 w-10 items-center justify-center rounded-full text-2xl font-light text-white"
            style={{ background: 'rgba(0,0,0,0.45)' }}
            aria-label="닫기"
          >
            ×
          </button>
          {modalIndex > 0 && (
            <button
              type="button"
              onClick={goPrev}
              className="absolute left-2 z-[102] rounded-full px-3 py-4 text-3xl text-white md:left-6"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              aria-label="이전"
            >
              ‹
            </button>
          )}
          {modalIndex < images.length - 1 && (
            <button
              type="button"
              onClick={goNext}
              className="absolute right-2 z-[102] rounded-full px-3 py-4 text-3xl text-white md:right-6"
              style={{ background: 'rgba(0,0,0,0.35)' }}
              aria-label="다음"
            >
              ›
            </button>
          )}
          <div
            className="relative mx-4 h-[min(85vh,100%)] w-full max-w-5xl touch-pan-x"
            style={{ touchAction: 'pan-x' }}
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
          <div
            className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center text-white/90 tabular-nums"
            style={{ fontSize: AUDITION_DETAIL.bodyFontPx }}
          >
            {modalIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  )
}
