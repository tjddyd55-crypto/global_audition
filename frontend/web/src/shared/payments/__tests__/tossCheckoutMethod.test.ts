import {
  buildTossPaymentRequest,
  defaultOverseasCountry,
  overseasCountryOptions,
  parseTossCheckoutMethod,
} from '../tossCheckoutMethod'

const base = {
  amount: 10,
  orderId: 'ORD-1',
  orderName: 'Test 10 Credits',
  successUrl: 'https://x/ko/credits/toss/success',
  failUrl: 'https://x/ko/credits/result/fail',
}

describe('buildTossPaymentRequest', () => {
  it('overseas easy pay always sends provider and country', () => {
    const r = buildTossPaymentRequest({ ...base, method: 'OVERSEAS_EASY_PAY', currency: 'USD', country: 'mn' })
    expect(r).toEqual({
      ok: true,
      request: expect.objectContaining({
        method: 'FOREIGN_EASY_PAY',
        amount: { currency: 'USD', value: 10 },
        foreignEasyPay: { provider: 'PAYPAL', country: 'MN' },
      }),
    })
  })

  it('overseas easy pay without country is rejected before calling Toss', () => {
    expect(buildTossPaymentRequest({ ...base, method: 'OVERSEAS_EASY_PAY', currency: 'USD', country: '' })).toEqual({
      ok: false,
      code: 'COUNTRY_REQUIRED',
    })
  })

  it('overseas card uses CARD + useInternationalCardOnly in USD', () => {
    const r = buildTossPaymentRequest({ ...base, method: 'OVERSEAS_CARD', currency: 'USD', locale: 'mn' })
    expect(r.ok && r.request).toEqual(
      expect.objectContaining({
        method: 'CARD',
        amount: { currency: 'USD', value: 10 },
        card: { flowMode: 'DEFAULT', useInternationalCardOnly: true, language: 'EN' },
      })
    )
  })

  it('domestic never converts USD on the client', () => {
    expect(buildTossPaymentRequest({ ...base, method: 'DOMESTIC', currency: 'USD' })).toEqual({
      ok: false,
      code: 'DOMESTIC_REQUIRES_KRW',
    })
    const r = buildTossPaymentRequest({ ...base, method: 'DOMESTIC', currency: 'KRW', amount: 13000 })
    expect(r.ok && r.request).toEqual(
      expect.objectContaining({ method: 'CARD', amount: { currency: 'KRW', value: 13000 }, card: { flowMode: 'DEFAULT' } })
    )
  })

  it('sends uppercase card language accepted by Toss', () => {
    const r = buildTossPaymentRequest({ ...base, method: 'OVERSEAS_CARD', currency: 'USD', locale: 'ko' })
    expect(r.ok && (r.request.card as { language: string }).language).toBe('KO')
  })

  it('overseas methods refuse non-USD', () => {
    expect(buildTossPaymentRequest({ ...base, method: 'OVERSEAS_CARD', currency: 'KRW' })).toEqual({
      ok: false,
      code: 'OVERSEAS_REQUIRES_USD',
    })
  })

  it('passes variantKey only when set', () => {
    const r = buildTossPaymentRequest({ ...base, method: 'OVERSEAS_CARD', currency: 'USD', variantKey: null })
    expect(r.ok && 'variantKey' in r.request).toBe(false)
  })
})

describe('country helpers', () => {
  it('defaults overseas country from account, never KR', () => {
    expect(defaultOverseasCountry('mn')).toBe('MN')
    expect(defaultOverseasCountry('KR')).toBe('US')
    expect(defaultOverseasCountry(null)).toBe('US')
    expect(overseasCountryOptions('NZ')[0]).toBe('NZ')
  })

  it('parses method query values', () => {
    expect(parseTossCheckoutMethod('overseas_card')).toBe('OVERSEAS_CARD')
    expect(parseTossCheckoutMethod('x')).toBeNull()
  })
})
