/**
 * 국가 필터 칩은 옵션과 언어가 달라도 같은 프레임을 쓴다.
 * 줄바꿈 대신 필터 줄 안에서만 가로로 스크롤한다.
 */
export const COUNTRY_CHIP_HEIGHT = 36
export const COUNTRY_CHIP_PADDING_HORIZONTAL = 14
export const COUNTRY_FILTER_AXIS = 'horizontal' as const

export const COUNTRY_CHIP_ROW = {
  flexDirection: 'row' as const,
  flexWrap: 'nowrap' as const,
  alignItems: 'center' as const,
}

export type CountryChipFrame = {
  height: number
  paddingHorizontal: number
}

export function chipFrameFor(_option: string): CountryChipFrame {
  return {
    height: COUNTRY_CHIP_HEIGHT,
    paddingHorizontal: COUNTRY_CHIP_PADDING_HORIZONTAL,
  }
}

/** 선택 칩을 보이게 할 때 양옆에 남길 여백(px). */
export const CHIP_REVEAL_MARGIN = 16

/**
 * 선택된 칩이 가로 스크롤 영역 밖(일부라도)에 있으면 보이도록 할 offset 을 돌려준다.
 * 이미 완전히 보이면 null → 사용자가 맞춘 스크롤 위치를 그대로 둔다.
 */
export function chipRevealOffset(input: {
  chipX: number
  chipWidth: number
  viewportWidth: number
  contentWidth: number
  currentOffset: number
  margin?: number
}): number | null {
  const { chipX, chipWidth, viewportWidth, contentWidth, currentOffset } = input
  const margin = input.margin ?? CHIP_REVEAL_MARGIN
  if (viewportWidth <= 0 || chipWidth <= 0) return null
  const maxOffset = Math.max(0, contentWidth - viewportWidth)
  const visibleStart = currentOffset
  const visibleEnd = currentOffset + viewportWidth
  let target: number
  if (chipX < visibleStart) {
    target = chipX - margin
  } else if (chipX + chipWidth > visibleEnd) {
    target = chipX + chipWidth + margin - viewportWidth
  } else {
    return null
  }
  const clamped = Math.min(maxOffset, Math.max(0, target))
  return Math.abs(clamped - currentOffset) < 1 ? null : clamped
}
