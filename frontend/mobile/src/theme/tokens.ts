/**
 * Native visual SSOT — Figma Native Foundation + 기존 웹 브랜드 값.
 */
export const colors = {
  bg: '#fafafa',
  surface: '#ffffff',
  text: '#111827',
  textSecondary: '#6b7280',
  muted: '#666666',
  faint: '#9ca3af',
  border: '#eeeeee',
  inputBorder: '#dddddd',
  purple: '#7c3aed',
  purplePressed: '#6d28d9',
  pink: '#ec4899',
  heroStart: '#f5f3ff',
  gradientStart: '#7c3aed',
  gradientEnd: '#ec4899',
  tabInactive: '#9ca3af',
  successBg: '#dcfce7',
  successText: '#166534',
  statusOpenBg: '#dcfce7',
  statusOpenText: '#166534',
  roundBg: '#ede9fe',
  roundText: '#6d28d9',
  ddayBg: '#fce7f3',
  ddayText: '#be185d',
  dangerBg: '#fef2f2',
  dangerText: '#b91c1c',
  warnBg: '#fffbeb',
  warnText: '#92400e',
  infoBg: '#eff6ff',
  infoText: '#1d4ed8',
} as const

/** 4 / 8 / 12 / 16 / 24 / 32 기반 */
export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const

export const radius = {
  card: 14,
  pill: 999,
  button: 10,
  input: 8,
  chip: 8,
} as const

export const touch = {
  min: 44,
} as const

export const badge = {
  height: 26,
  fontSize: 12,
} as const

export const tabBar = {
  height: 72,
  iconSize: 22,
} as const
