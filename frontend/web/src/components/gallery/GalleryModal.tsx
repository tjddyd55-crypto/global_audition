'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'

export type GalleryModalProps = {
  images: string[]
  currentIndex: number
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
  onClose: () => void
}

function ModalImageInner({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
  }, [src])

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={failed ? AUDITION_COVER_PLACEHOLDER_SRC : src}
      alt={label}
      className="pointer-events-none max-h-[90vh] max-w-[90vw] select-none object-contain"
      onError={() => setFailed(true)}
      draggable={false}
    />
  )
}

export function GalleryModal({ images, currentIndex, setCurrentIndex, onClose }: GalleryModalProps) {
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentIndex((i) => Math.max(0, i - 1))
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentIndex((i) => Math.min(images.length - 1, i + 1))
      }
    }
    window.addEventListener('keydown', handleKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = prevOverflow
    }
  }, [images.length, onClose, setCurrentIndex])

  const goPrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      setCurrentIndex((i) => Math.max(0, i - 1))
    },
    [setCurrentIndex]
  )

  const goNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      setCurrentIndex((i) => Math.min(images.length - 1, i + 1))
    },
    [images.length, setCurrentIndex]
  )

  const current = images[currentIndex] ?? ''

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null
  }

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return
    const end = e.changedTouches[0]?.clientX
    if (end == null) return
    const dx = end - start
    const threshold = 56
    if (dx > threshold) goPrev()
    else if (dx < -threshold) goNext()
  }

  if (images.length === 0) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex cursor-default items-center justify-center bg-black/90"
      role="dialog"
      aria-modal
      aria-label="이미지 확대 보기"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        className="absolute right-3 top-3 z-[102] flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-2xl text-white md:h-10 md:w-10"
        aria-label="닫기"
      >
        ×
      </button>

      {currentIndex > 0 && (
        <button
          type="button"
          onClick={goPrev}
          className="absolute left-2 z-[102] flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/50 text-3xl text-white md:left-6 md:min-h-0 md:min-w-0 md:px-4 md:py-6"
          aria-label="이전 이미지"
        >
          ‹
        </button>
      )}
      {currentIndex < images.length - 1 && (
        <button
          type="button"
          onClick={goNext}
          className="absolute right-2 z-[102] flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/50 text-3xl text-white md:right-6 md:min-h-0 md:min-w-0 md:px-4 md:py-6"
          aria-label="다음 이미지"
        >
          ›
        </button>
      )}

      <div
        className="relative flex max-h-full max-w-full items-center justify-center px-4"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <ModalImageInner src={current} label={`이미지 ${currentIndex + 1} / ${images.length}`} />
      </div>

      <div className="pointer-events-none absolute bottom-6 left-0 right-0 flex justify-center tabular-nums text-sm text-white/90">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}
