'use client'

import { ImageViewerOverlay } from '@/components/gallery/ImageViewerOverlay'

export type GalleryModalProps = {
  images: string[]
  currentIndex: number
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>
  onClose: () => void
}

/** ImageViewerOverlay 래퍼 — 기존 AuditionGallery props 유지 */
export function GalleryModal({ images, currentIndex, setCurrentIndex, onClose }: GalleryModalProps) {
  if (images.length === 0) return null
  return (
    <ImageViewerOverlay
      images={images}
      currentIndex={currentIndex}
      onIndexChange={(i) => setCurrentIndex(i)}
      onClose={onClose}
    />
  )
}
