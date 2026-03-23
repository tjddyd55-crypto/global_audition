'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'
import { GalleryModal } from '@/components/gallery/GalleryModal'

export type AuditionGalleryProps = {
  coverImage: string
  /** 대표와 중복 제외된 갤러리 URL 목록 (상세 페이지 SSOT와 동일하게 넘기면 됨) */
  images?: string[]
}

function buildAllImages(coverImage: string, images: string[] | undefined): string[] {
  const cover = coverImage.trim()
  const rest = (images ?? []).map((u) => u.trim()).filter(Boolean)
  const galleryOnly = cover ? rest.filter((u) => u !== cover) : rest
  return cover ? [cover, ...galleryOnly] : galleryOnly
}

function GalleryMainImage({ src, label }: { src: string; label: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
  }, [src])
  const url = failed ? AUDITION_COVER_PLACEHOLDER_SRC : src

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={label}
      className="max-h-full max-w-full object-contain"
      onError={() => setFailed(true)}
    />
  )
}

function ThumbnailButton({
  src,
  index,
  isActive,
  onSelect,
}: {
  src: string
  index: number
  isActive: boolean
  onSelect: (i: number) => void
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    setFailed(false)
  }, [src])
  const url = failed ? AUDITION_COVER_PLACEHOLDER_SRC : src

  return (
    <button
      type="button"
      onClick={() => onSelect(index)}
      className={`relative h-20 shrink-0 aspect-video cursor-pointer overflow-hidden rounded border-2 bg-black transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
        isActive ? 'border-purple-500' : 'border-transparent'
      }`}
      aria-label={`이미지 ${index + 1} 보기`}
      aria-current={isActive ? 'true' : undefined}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </button>
  )
}

export default function AuditionGallery({ coverImage, images = [] }: AuditionGalleryProps) {
  const allImages = buildAllImages(coverImage, images)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    if (allImages.length === 0) return
    setCurrentIndex((prev) => Math.min(prev, allImages.length - 1))
  }, [allImages.length])

  const current = allImages[currentIndex] ?? ''
  const canPrev = currentIndex > 0
  const canNext = currentIndex < allImages.length - 1

  const goPrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      setCurrentIndex((i) => Math.max(0, i - 1))
    },
    []
  )

  const goNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      setCurrentIndex((i) => Math.min(allImages.length - 1, i + 1))
    },
    [allImages.length]
  )

  const onMainTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0]?.clientX ?? null
  }

  const onMainTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start == null) return
    const end = e.changedTouches[0]?.clientX
    if (end == null) return
    const dx = end - start
    const threshold = 48
    if (dx > threshold) goPrev()
    else if (dx < -threshold) goNext()
  }

  if (allImages.length === 0) {
    return (
      <p className="m-0 text-sm text-gray-500">등록된 이미지가 없습니다.</p>
    )
  }

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={0}
        className="group relative flex w-full cursor-pointer items-center justify-center bg-black aspect-video"
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(true)
          }
        }}
        onTouchStart={onMainTouchStart}
        onTouchEnd={onMainTouchEnd}
      >
        <GalleryMainImage src={current} label={`이미지 ${currentIndex + 1} / ${allImages.length}`} />

        {canPrev && (
          <button
            type="button"
            className="absolute left-1 z-[1] flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/50 text-2xl text-white opacity-100 transition-opacity md:left-2 md:opacity-0 md:group-hover:opacity-100"
            onClick={goPrev}
            aria-label="이전 이미지"
          >
            ‹
          </button>
        )}
        {canNext && (
          <button
            type="button"
            className="absolute right-1 z-[1] flex min-h-12 min-w-12 items-center justify-center rounded-full bg-black/50 text-2xl text-white opacity-100 transition-opacity md:right-2 md:opacity-0 md:group-hover:opacity-100"
            onClick={goNext}
            aria-label="다음 이미지"
          >
            ›
          </button>
        )}
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:thin]">
        {allImages.map((img, idx) => (
          <ThumbnailButton
            key={`${idx}-${img.slice(0, 48)}`}
            src={img}
            index={idx}
            isActive={idx === currentIndex}
            onSelect={setCurrentIndex}
          />
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
