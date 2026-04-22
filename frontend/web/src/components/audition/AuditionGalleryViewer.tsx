'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TEXT_SUB } from '@/shared/ui/specClasses'
import { AUDITION_COVER_PLACEHOLDER_SRC } from '@/components/audition/AuditionEditorPreview'
import { ImageViewerOverlay } from '@/components/gallery/ImageViewerOverlay'

function GalleryThumb({ src, onOpen }: { src: string; onOpen: () => void }) {
  const [failed, setFailed] = useState(false)
  const url = failed ? AUDITION_COVER_PLACEHOLDER_SRC : src
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative flex h-44 w-[min(320px,85vw)] shrink-0 snap-center cursor-pointer items-center justify-center overflow-hidden rounded-md border-0 bg-gray-100 p-2"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="max-h-full max-w-full object-contain"
        onError={() => setFailed(true)}
      />
    </button>
  )
}

type Props = {
  images: string[]
}

function preloadUrl(url: string | undefined) {
  if (!url || typeof window === 'undefined') return
  const img = new window.Image()
  img.src = url
}

/**
 * 가로 스크롤 + snap, 탭 시 ImageViewerOverlay(순환·스와이프·도트).
 */
export function AuditionGalleryViewer({ images }: Props) {
  const [modalIndex, setModalIndex] = useState<number | null>(null)
  const [stripIndex, setStripIndex] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)

  const close = useCallback(() => setModalIndex(null), [])

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

  if (images.length === 0) return null

  return (
    <div className="relative">
      <div
        ref={scrollerRef}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 touch-pan-x [-webkit-overflow-scrolling:touch]"
      >
        {images.map((src, i) => (
          <GalleryThumb key={`g-strip-${i}-${src.slice(0, 24)}`} src={src} onOpen={() => setModalIndex(i)} />
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
        <ImageViewerOverlay
          images={images}
          currentIndex={modalIndex}
          onIndexChange={setModalIndex}
          onClose={close}
          ariaLabel="갤러리"
        />
      )}
    </div>
  )
}
