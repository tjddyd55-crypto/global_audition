import { formatCount } from './currency'

/**
 * 크레딧(포인트) 수량 표시 — 통화가 아님. 천 단위는 {@link formatCount} 와 같다.
 */
export function formatCreditsCount(n: number, locale = 'en'): string {
  return formatCount(Number.isFinite(n) ? n : 0, locale)
}
