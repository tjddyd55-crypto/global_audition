import { getRuntimeLocale } from './runtime'

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

/** Web `formatCurrency` 와 동일 계약: 정산 통화 USD, 로케일별 Intl. */
export function formatUsd(amount: number, locale = getRuntimeLocale()): string {
  const n = Number.isFinite(amount) ? amount : 0
  return new Intl.NumberFormat(INTL_BY_APP_LOCALE[locale] ?? 'en-US', {
    style: 'currency',
    currency: SETTLEMENT_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}
