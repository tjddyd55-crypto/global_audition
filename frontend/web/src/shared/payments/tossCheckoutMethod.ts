/**
 * 토스 결제창(v2 standard) 결제수단별 요청 파라미터.
 *
 * - DOMESTIC: 국내 카드·간편결제. 토스 국내 결제창은 KRW만 받는다.
 *   KRW 금액은 서버가 관리자 등록 환율(payment_fx_rates)로 확정한 주문에서만 온다. 클라이언트는 환산하지 않는다.
 * - OVERSEAS_CARD: 해외카드(Visa/Master/JCB 등). USD + card.useInternationalCardOnly.
 * - OVERSEAS_EASY_PAY: 해외간편결제(PayPal 등). USD + foreignEasyPay.provider + country(필수).
 */
export const TOSS_CHECKOUT_METHODS = ['DOMESTIC', 'OVERSEAS_CARD', 'OVERSEAS_EASY_PAY'] as const
export type TossCheckoutMethod = (typeof TOSS_CHECKOUT_METHODS)[number]

export const FOREIGN_EASY_PAY_PROVIDERS = ['PAYPAL'] as const
export type ForeignEasyPayProvider = (typeof FOREIGN_EASY_PAY_PROVIDERS)[number]

/** 해외간편결제 국가 선택지. 계정 국가가 목록에 없으면 그 값도 앞에 붙인다. */
export const OVERSEAS_COUNTRIES = ['US', 'MN', 'JP', 'PH', 'AU', 'CA', 'GB', 'SG', 'HK', 'TW', 'VN', 'TH', 'ID', 'MY', 'DE', 'FR'] as const

export function parseTossCheckoutMethod(raw: string | null | undefined): TossCheckoutMethod | null {
  const v = (raw ?? '').trim().toUpperCase()
  return (TOSS_CHECKOUT_METHODS as readonly string[]).includes(v) ? (v as TossCheckoutMethod) : null
}

/** ISO 3166-1 alpha-2 대문자. 아니면 null. */
export function normalizeCountry(raw: string | null | undefined): string | null {
  const v = (raw ?? '').trim().toUpperCase()
  return /^[A-Z]{2}$/.test(v) ? v : null
}

/** 해외간편결제 기본 국가: 계정 국가(KR 제외) → US. PayPal 해외결제는 구매자 국가가 KR이면 의미가 없다. */
export function defaultOverseasCountry(accountCountry: string | null | undefined): string {
  const c = normalizeCountry(accountCountry)
  return c && c !== 'KR' ? c : 'US'
}

export function overseasCountryOptions(accountCountry: string | null | undefined): string[] {
  const c = normalizeCountry(accountCountry)
  const base: string[] = [...OVERSEAS_COUNTRIES]
  return c && c !== 'KR' && !base.includes(c) ? [c, ...base] : base
}

export type TossRequestInput = {
  method: TossCheckoutMethod
  currency: string
  amount: number
  orderId: string
  orderName: string
  successUrl: string
  failUrl: string
  country?: string | null
  easyPayProvider?: ForeignEasyPayProvider | null
  variantKey?: string | null
  /** 해외카드 결제창 언어 */
  locale?: string | null
}

export type TossRequestResult =
  | { ok: true; request: Record<string, unknown> }
  | { ok: false; code: 'DOMESTIC_REQUIRES_KRW' | 'COUNTRY_REQUIRED' | 'INVALID_AMOUNT' | 'OVERSEAS_REQUIRES_USD' }

function cardLanguage(locale: string | null | undefined): string {
  return locale === 'ko' ? 'ko' : 'en'
}

export function buildTossPaymentRequest(input: TossRequestInput): TossRequestResult {
  const currency = (input.currency || '').trim().toUpperCase()
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, code: 'INVALID_AMOUNT' }
  }
  const common: Record<string, unknown> = {
    amount: { currency, value: input.amount },
    orderId: input.orderId,
    orderName: input.orderName,
    successUrl: input.successUrl,
    failUrl: input.failUrl,
    ...(input.variantKey ? { variantKey: input.variantKey } : {}),
  }
  if (input.method === 'DOMESTIC') {
    if (currency !== 'KRW') return { ok: false, code: 'DOMESTIC_REQUIRES_KRW' }
    // CARD 결제창은 국내 카드사와 간편결제(토스페이·카카오페이 등)를 함께 보여준다.
    return { ok: true, request: { ...common, method: 'CARD', card: { flowMode: 'DEFAULT' } } }
  }
  if (currency !== 'USD') return { ok: false, code: 'OVERSEAS_REQUIRES_USD' }
  if (input.method === 'OVERSEAS_CARD') {
    return {
      ok: true,
      request: {
        ...common,
        method: 'CARD',
        card: { flowMode: 'DEFAULT', useInternationalCardOnly: true, language: cardLanguage(input.locale) },
      },
    }
  }
  const country = normalizeCountry(input.country)
  if (!country) return { ok: false, code: 'COUNTRY_REQUIRED' }
  return {
    ok: true,
    request: {
      ...common,
      method: 'FOREIGN_EASY_PAY',
      foreignEasyPay: { provider: input.easyPayProvider || 'PAYPAL', country },
    },
  }
}
