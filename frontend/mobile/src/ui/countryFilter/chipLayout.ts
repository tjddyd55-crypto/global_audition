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
