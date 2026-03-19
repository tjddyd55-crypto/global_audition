'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { AUDITION_DETAIL } from '@/lib/design-tokens'

type Props = {
  images: string[]
}

/**
 * 가로 스크롤 + snap, 탭 시 전체 화면 모달(좌우 이동·닫기). design-tokens 기준 radius만 사용.
 */
export function AuditionGalleryViewer({ images }: Props) {
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  const close = useCallback(() => setModalIndex(null), [])
  const goPrev = useCallback(() => {
    setModalIndex((i) => (i !== null && i > 0 ? i - 1 : i))
  }, [])
  const goNext = useCallback(() => {
    setModalIndex((i) => (i !== null && i < images.length - 1 ? i + 1 : i))
  }, [images.length])

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

  if (images.length === 0) return null

  const thumbW = 'min(280px, 85vw)'

  return (
    <>
      <div
        className="flex overflow-x-auto pb-2 -mx-1"
        style={{
          gap: AUDITION_DETAIL.galleryGapPx,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
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
            className="relative mx-4 h-[min(85vh,100%)] w-full max-w-5xl"
            onClick={(e) => e.stopPropagation()}
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
        </div>
      )}
    </>
  )
}
