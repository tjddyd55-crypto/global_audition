/**
 * 크레딧(포인트) 수량 표시 — 통화가 아님. 천 단위만 en-US 로 통일.
 */
export function formatCreditsCount(n: number): string {
  const v = Number.isFinite(n) ? n : 0
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(v)
}
