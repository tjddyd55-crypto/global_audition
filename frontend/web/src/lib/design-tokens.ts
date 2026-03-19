/**
 * Pixel-perfect design tokens (Figma-level)
 * 모든 UI는 이 값으로 통일
 */

export const LAYOUT = {
  containerMaxWidth: 1200,
  containerPaddingPx: 24,
  sectionGapPx: 80,
  cardPaddingPx: 16,
} as const

export const HEADER = {
  heightPx: 64,
  paddingPx: 24,
  logoSizePx: 36,
  logoFontSizePx: 16,
  logoFontWeight: 600,
  navGapPx: 32,
  navFontSizePx: 14,
  navColor: '#555555',
  navHoverColor: '#000000',
  borderColor: '#eeeeee',
} as const

export const HERO = {
  paddingTopPx: 120,
  paddingBottomPx: 100,
  titleFontSizePx: 40,
  titleFontWeight: 700,
  titleLineHeight: 1.3,
  subMarginTopPx: 12,
  subFontSizePx: 16,
  subColor: '#666666',
  buttonsMarginTopPx: 24,
  buttonsGapPx: 12,
  buttonHeightPx: 44,
  buttonPaddingPx: 20,
  buttonRadiusPx: 8,
  gradientStart: '#f5f3ff',
  gradientEnd: '#ffffff',
  primaryGradientStart: '#7c3aed',
  primaryGradientEnd: '#ec4899',
  secondaryBorderColor: '#dddddd',
} as const

export const AUDITION_CARD = {
  paddingPx: 20,
  borderRadiusPx: 12,
  borderColor: '#eeeeee',
  titleFontSizePx: 16,
  titleFontWeight: 600,
  badgeFontSizePx: 12,
  badgePaddingY: 4,
  badgePaddingX: 8,
  badgeRadius: 999,
  badgeBg: '#dcfce7',
  badgeColor: '#166534',
  categoryFontSizePx: 12,
  categoryBorderColor: '#dddddd',
  categoryPaddingY: 2,
  categoryPaddingX: 6,
  categoryRadiusPx: 6,
  descFontSizePx: 13,
  descColor: '#666666',
  descLineHeight: 1.5,
  imageHeightPx: 160,
  imageRadiusPx: 10,
  imageBg: '#f3f4f6',
  dateFontSizePx: 12,
  dateColor: '#888888',
} as const

export const VIDEO_CARD = {
  thumbnailHeightPx: 180,
  thumbnailRadiusPx: 10,
  badgeTopPx: 8,
  badgeRightPx: 8,
  badgeBg: '#9333ea',
  badgeFontSizePx: 12,
  badgePaddingY: 4,
  badgePaddingX: 8,
  badgeRadius: 999,
  profileSizePx: 28,
  profileGapPx: 8,
  titleFontSizePx: 14,
  titleFontWeight: 600,
  metaFontSizePx: 12,
  metaColor: '#888888',
} as const

export const CHANNEL_CARD = {
  gridGapPx: 24,
  cardPaddingPx: 24,
  profileSizePx: 72,
  nameMarginTopPx: 12,
  nameFontWeight: 600,
  nameFontSizePx: 16,
  descMarginTopPx: 6,
  descFontSizePx: 13,
  descColor: '#666666',
  statsMarginTopPx: 12,
  statsFontSizePx: 12,
  statsColor: '#444444',
  buttonMarginTopPx: 12,
  buttonFontSizePx: 13,
  buttonColor: '#7c3aed',
} as const

export const SIGNUP = {
  cardWidthPx: 400,
  cardMarginTopPx: 80,
  cardPaddingPx: 32,
  cardRadiusPx: 12,
  cardBorderColor: '#eeeeee',
  titleFontSizePx: 20,
  titleFontWeight: 600,
  inputHeightPx: 40,
  inputRadiusPx: 8,
  inputBorderColor: '#dddddd',
  inputPaddingPx: 12,
  inputFontSizePx: 14,
  roleGapPx: 8,
  roleSelectedBorder: '#7c3aed',
  roleSelectedBg: '#f5f3ff',
} as const
