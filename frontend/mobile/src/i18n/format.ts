import { getRuntimeLocale } from './runtime'

export const SETTLEMENT_CURRENCY = 'USD'

/** 사용자 표시: `$10` 정수 달러만. `$10.00` / 센트 / float 금지. */
export function formatWholeUsd(amount: number): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0
  return `$${n}`
}

/** Web `formatCurrency` 와 동일 계약: 정수 USD major unit. */
export function formatUsd(amount: number, _locale = getRuntimeLocale()): string {
  return formatWholeUsd(amount)
}

export function formatRelativeTime(iso: string, locale = getRuntimeLocale()): string {
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) return iso
  const diffMs = parsed - Date.now()
  const absSec = Math.round(Math.abs(diffMs) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
    ['second', 1],
  ]
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    for (const [unit, sec] of units) {
      if (absSec >= sec || unit === 'second') {
        const value = Math.round(diffMs / (sec * 1000))
        return rtf.format(value, unit)
      }
    }
  } catch {
    return iso.slice(0, 10)
  }
  return iso.slice(0, 10)
}

export function formatLocaleDate(iso: string, locale = getRuntimeLocale()): string {
  const parsed = Date.parse(iso)
  if (!Number.isFinite(parsed)) return iso
  try {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(parsed)
  } catch {
    return iso.slice(0, 10)
  }
}
