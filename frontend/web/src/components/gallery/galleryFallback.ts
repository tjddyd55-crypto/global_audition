import type { SyntheticEvent } from 'react'

/**
 * 갤러리·모달 등 이미지 로드 실패 시 대체용 단일 정적 자산.
 * (예시 `/images/placeholder.png` 대신 리포에 포함된 SVG 사용 — PNG 추가 시 이 상수만 교체)
 */
export const GALLERY_IMAGE_FALLBACK_SRC = '/audition-cover-placeholder.svg'

/**
 * img onError 시 플레이스홀더로 교체. 재시도 시 무한 루프 방지.
 */
export function applyGalleryImageOnError(e: SyntheticEvent<HTMLImageElement>): void {
  const el = e.currentTarget
  if (el.dataset.galleryFallbackApplied === '1') return
  el.dataset.galleryFallbackApplied = '1'
  el.src = GALLERY_IMAGE_FALLBACK_SRC
}
