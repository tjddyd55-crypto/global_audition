/**
 * 웹 design-tokens.ts 브랜드 값을 네이티브용으로 옮긴다.
 * Figma 미접근 시 웹 토큰이 시각 SSOT다.
 */
export const colors = {
  bg: '#fafafa',
  surface: '#ffffff',
  text: '#111827',
  muted: '#666666',
  faint: '#888888',
  border: '#eeeeee',
  inputBorder: '#dddddd',
  purple: '#7c3aed',
  purplePressed: '#6d28d9',
  pink: '#ec4899',
  heroStart: '#f5f3ff',
  successBg: '#dcfce7',
  successText: '#166534',
  dangerBg: '#fef2f2',
  dangerText: '#b91c1c',
  warnBg: '#fffbeb',
  warnText: '#92400e',
  infoBg: '#eff6ff',
  infoText: '#1d4ed8',
} as const

export const space = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 24,
} as const

export const radius = {
  card: 12,
  pill: 999,
  button: 10,
  input: 8,
} as const

export const touch = {
  min: 44,
} as const
