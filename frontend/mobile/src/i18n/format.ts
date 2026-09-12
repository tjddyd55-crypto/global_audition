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
