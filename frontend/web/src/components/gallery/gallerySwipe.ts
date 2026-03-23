/** 모바일 스와이프: 의도 없는 페이지 전환 방지 */
export const GALLERY_SWIPE_MIN_DISTANCE_PX = 50

/** 짧고 빠른 스와이프는 거리가 다소 작아도 인정 (px) */
export const GALLERY_SWIPE_VELOCITY_MIN_DELTA_PX = 28

/** px/ms — 빠른 플릭 */
export const GALLERY_SWIPE_VELOCITY_MIN_PX_PER_MS = 0.3

export function shouldTriggerSwipeNavigation(
  deltaX: number,
  durationMs: number
): 'prev' | 'next' | null {
  const abs = Math.abs(deltaX)
  if (abs < GALLERY_SWIPE_VELOCITY_MIN_DELTA_PX && abs < GALLERY_SWIPE_MIN_DISTANCE_PX) {
    return null
  }

  const passedDistance = abs > GALLERY_SWIPE_MIN_DISTANCE_PX
  const velocity = durationMs > 0 ? abs / durationMs : 0
  const passedVelocity =
    abs >= GALLERY_SWIPE_VELOCITY_MIN_DELTA_PX && velocity >= GALLERY_SWIPE_VELOCITY_MIN_PX_PER_MS

  if (!passedDistance && !passedVelocity) return null

  if (deltaX > 0) return 'prev'
  if (deltaX < 0) return 'next'
  return null
}
