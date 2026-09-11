/**
 * 플랫폼 정산 표시 통화: USD.
 * Toss amount.value 는 정수 달러(major unit). Stripe 센트 변환은 레거시 전용.
 */
export const SETTLEMENT_CURRENCY = 'USD'

const INTL_BY_APP_LOCALE: Record<string, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  mn: 'mn-MN',
  ja: 'ja-JP',
  zh: 'zh-CN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
}

export function intlLocaleFor(appLocale?: string): string {
  if (!appLocale) return 'en-US'
  return INTL_BY_APP_LOCALE[appLocale] ?? 'en-US'
}

/** 사용자 표시: `$10` 정수 달러만. `$10.00` / 센트 / float 금지. */
export function formatWholeUsd(amount: number): string {
  const n = Number.isFinite(amount) ? Math.round(amount) : 0
  return `$${n}`
}

export function formatCurrency(amount: number, _locale = 'en'): string {
  return formatWholeUsd(amount)
}

/** Stripe PaymentIntent 등: USD 달러 → 센트 정수. Toss 경로에서는 사용하지 않는다. */
export function usdToStripeCents(usd: number): number {
  return Math.round((Number.isFinite(usd) ? usd : 0) * 100)
}

/** Toss / 패키지 가격: 정수 달러만. */
export function parseWholeUsdDollars(formatted: string, fallback = 0): number {
  const n = Number.parseFloat(formatted.trim().replace(/,/g, ''))
  if (!Number.isFinite(n) || n <= 0) return fallback
  if (Math.abs(n - Math.round(n)) > 1e-9) return fallback
  return Math.round(n)
}

export function isWholeUsdDollars(value: number): boolean {
  return Number.isFinite(value) && value > 0 && Math.abs(value - Math.round(value)) < 1e-9
}
