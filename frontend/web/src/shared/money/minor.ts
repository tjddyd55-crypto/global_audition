import { formatCount } from './currency'

const MINOR_SCALE: Record<string, number> = { USD: 2, KRW: 0, JPY: 0 }

export function minorScale(currency: string): number {
  return MINOR_SCALE[currency] ?? 2
}

/** Grouped minor-unit display. The whole part uses {@link formatCount}. */
export function formatMinorGrouped(
  amountMinor: number | null | undefined,
  currency: string,
  locale = 'ko'
): string {
  if (amountMinor == null || !Number.isInteger(amountMinor)) return '—'
  const scale = minorScale(currency)
  const negative = amountMinor < 0
  const digits = Math.abs(amountMinor).toString().padStart(scale + 1, '0')
  const whole = scale === 0 ? digits : digits.slice(0, -scale)
  const fraction = scale === 0 ? '' : digits.slice(-scale)
  const grouped = formatCount(Number(whole), locale)
  const shown = scale === 0 ? grouped : `${grouped}.${fraction}`
  return `${negative ? '-' : ''}${shown} ${currency}`
}

/** Integer minor-unit display with a thousands separator. Does not use binary floating point. */
export function formatMinorAmount(amountMinor: number, scale: number, currency: string): string {
  if (!Number.isInteger(amountMinor) || !Number.isInteger(scale) || scale < 0 || scale > 8) {
    return ''
  }
  const negative = amountMinor < 0
  const digits = Math.abs(amountMinor).toString().padStart(scale + 1, '0')
  const whole = scale === 0 ? digits : digits.slice(0, -scale)
  const fraction = scale === 0 ? '' : digits.slice(-scale)
  const grouped = formatCount(Number(whole), 'en')
  const shown = scale === 0 ? grouped : `${grouped}.${fraction}`
  return `${negative ? '-' : ''}${shown} ${currency}`
}
