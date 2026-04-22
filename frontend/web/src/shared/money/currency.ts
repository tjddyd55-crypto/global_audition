/**
 * 플랫폼 결제 표시 통화: USD (달러, 소수 2자리).
 * 금액은 항상 number 로 다루고, 표시만 문자열로 만든다.
 */
export function formatCurrency(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0
  return `$${n.toFixed(2)}`
}

/** Stripe PaymentIntent 등: USD 달러 → 센트 정수 */
export function usdToStripeCents(usd: number): number {
  return Math.round((Number.isFinite(usd) ? usd : 0) * 100)
}
