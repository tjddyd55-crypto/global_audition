import { intlLocaleFor } from './currency'

/**
 * 크레딧(포인트) 수량 표시 — 통화가 아님.
 */
export function formatCreditsCount(n: number, locale = 'en'): string {
  const v = Number.isFinite(n) ? n : 0
  return new Intl.NumberFormat(intlLocaleFor(locale), { maximumFractionDigits: 0 }).format(v)
}
