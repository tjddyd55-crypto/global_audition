'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { creditsApi, type PaymentOrderView, type PreparePaymentResult } from '@/shared/api/credits'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'
import { useLocale, useTranslations } from 'next-intl'
import {
  buildTossPaymentRequest,
  defaultOverseasCountry,
  overseasCountryOptions,
  parseTossCheckoutMethod,
  normalizeCountry,
  type TossCheckoutMethod,
  type TossRequestResult,
} from '@/shared/payments/tossCheckoutMethod'

const OVERSEAS_METHODS: TossCheckoutMethod[] = ['OVERSEAS_CARD', 'OVERSEAS_EASY_PAY']
const METHOD_LABEL: Record<TossCheckoutMethod, string> = {
  DOMESTIC: 'methodDomestic',
  OVERSEAS_CARD: 'methodOverseasCard',
  OVERSEAS_EASY_PAY: 'methodOverseasEasyPay',
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      payment: (opts: { customerKey: string }) => {
        requestPayment: (opts: Record<string, unknown>) => Promise<void>
      }
    }
  }
}

function TossCheckoutContent() {
  const t = useTranslations('payments')
  const locale = useLocale()
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get('packageId')?.trim() ?? ''
  const orderNoParam = searchParams.get('orderNo')?.trim() ?? ''
  const [prep, setPrep] = useState<PreparePaymentResult | null>(null)
  const [globalOrder, setGlobalOrder] = useState<PaymentOrderView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const methodParam = parseTossCheckoutMethod(searchParams.get('method'))
  const countryParam = normalizeCountry(searchParams.get('country'))
  const [method, setMethod] = useState<TossCheckoutMethod>(
    methodParam && methodParam !== 'DOMESTIC' ? methodParam : 'OVERSEAS_CARD'
  )
  const [accountCountry, setAccountCountry] = useState<string | null>(null)
  const [country, setCountry] = useState<string>(countryParam ?? 'US')
  const countryTouched = useRef(false)

  useEffect(() => {
    if (countryParam) return
    let cancelled = false
    authApi
      .me()
      .then((me) => {
        if (cancelled) return
        setAccountCountry(me.countryCode ?? null)
        if (!countryTouched.current) setCountry(defaultOverseasCountry(me.countryCode))
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [countryParam])

  const reportBuildError = (r: Extract<TossRequestResult, { ok: false }>, currency: string) => {
    if (r.code === 'COUNTRY_REQUIRED') setError(t('countryRequired'))
    else if (r.code === 'INVALID_AMOUNT') setError(t('missingPrep'))
    else setError(t('currencyMismatch', { currency }))
  }

  const tossErrorText = (e: unknown) => {
    const err = e as { code?: string; message?: string }
    if (err?.code && err?.message) return `[${err.code}] ${err.message}`
    return e instanceof Error ? e.message : t('createFailed')
  }

  useEffect(() => {
    if (!authApi.getToken()) {
      router.push('/login')
      return
    }
    if (!packageId && !orderNoParam) {
      setError(t('needOrder'))
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        if (orderNoParam) {
          try {
            const row = await creditsApi.getPaymentOrder(orderNoParam)
            if (!cancelled && row.provider === 'TOSS' && row.chargeAmountMinor != null && row.clientKey) {
              if (row.environment === 'LIVE') {
                setError(t('liveCheckoutBlocked'))
                return
              }
              if (row.environment === 'TEST') {
                setGlobalOrder(row)
                return
              }
            }
          } catch {
            // Legacy checkout session is the fallback.
          }
          const session = await creditsApi.getCheckoutSession(orderNoParam)
          if (!cancelled) setPrep(session)
          return
        }
        if (!packageId) {
          setError(t('needOrder'))
          return
        }
        const created = await creditsApi.preparePayment(packageId, 'TOSS_PAYMENTS')
        if (!cancelled) setPrep(created)
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { message?: string } } }
        if (!cancelled) setError(ax.response?.data?.message ?? t('createFailed'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [packageId, orderNoParam, router, t])

  const startPay = async () => {
    setError(null)
    const origin = window.location.origin
    const successUrl = `${origin}/${locale}/credits/toss/success`
    const failUrl = `${origin}/${locale}/credits/result/fail`
    if (globalOrder?.clientKey && globalOrder.chargeAmountMinor != null && globalOrder.chargeCurrency) {
      if (globalOrder.environment === 'LIVE') {
        setError(t('liveCheckoutBlocked'))
        return
      }
      if (!window.TossPayments) {
        setError(t('scriptFailed'))
        return
      }
      const legacyMethod = globalOrder.methodCode === 'TRANSFER' || globalOrder.methodCode === 'VIRTUAL_ACCOUNT' || globalOrder.methodCode === 'MOBILE_PHONE'
        ? globalOrder.methodCode
        : null
      let request: Record<string, unknown>
      if (legacyMethod) {
        request = {
          method: legacyMethod,
          amount: { currency: globalOrder.chargeCurrency, value: globalOrder.chargeAmountMinor },
          orderId: globalOrder.orderNo,
          orderName: `${globalOrder.credits} credits`,
          successUrl,
          failUrl,
        }
      } else {
        // 글로벌 주문 금액·통화(KRW 포함)는 서버가 확정한 값만 쓴다.
        const built = buildTossPaymentRequest({
          method: globalOrder.chargeCurrency === 'KRW' ? 'DOMESTIC' : 'OVERSEAS_CARD',
          currency: globalOrder.chargeCurrency,
          amount: globalOrder.chargeAmountMinor,
          orderId: globalOrder.orderNo,
          orderName: `${globalOrder.credits} credits`,
          successUrl,
          failUrl,
          locale,
        })
        if (!built.ok) {
          reportBuildError(built, globalOrder.chargeCurrency)
          return
        }
        request = built.request
      }
      try {
        const toss = window.TossPayments(globalOrder.clientKey)
        const payment = toss.payment({ customerKey: globalOrder.orderNo })
        await payment.requestPayment(request)
      } catch (e: unknown) {
        setError(tossErrorText(e))
      }
      return
    }
    if (!prep?.clientKey || !prep.tossAmount || !prep.orderNo) {
      setError(t('missingPrep'))
      return
    }
    if (!window.TossPayments) {
      setError(t('scriptFailed'))
      return
    }
    const currency = prep.currency || 'USD'
    const built = buildTossPaymentRequest({
      method,
      currency,
      amount: prep.tossAmount,
      orderId: prep.orderNo,
      orderName: prep.orderName || prep.packageName,
      successUrl,
      failUrl,
      country,
      easyPayProvider: 'PAYPAL',
      variantKey: prep.variantKey,
      locale,
    })
    if (!built.ok) {
      reportBuildError(built, currency)
      return
    }
    try {
      const toss = window.TossPayments(prep.clientKey)
      const payment = toss.payment({ customerKey: prep.orderNo })
      await payment.requestPayment(built.request)
    } catch (e: unknown) {
      setError(tossErrorText(e))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Script
        src="https://js.tosspayments.com/v2/standard"
        onLoad={() => setReady(true)}
        strategy="afterInteractive"
      />
      <div className={`${PAGE_CONTAINER} py-6`}>
        <h1 className={TITLE_PAGE}>{t('title')}</h1>
        <p className={`${TEXT_SUB} mt-2`}>{t('amountServerSettled')}</p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {globalOrder ? (
          <div className={`${CARD_BASE} mt-4`}>
            <p>
              {t('order')} {globalOrder.orderNo}
            </p>
            <p>
              {globalOrder.chargeAmountMinor} {globalOrder.chargeCurrency} · {globalOrder.credits} {t('creditsUnit')} · {globalOrder.environment}
            </p>
            {globalOrder.chargeCurrency === 'KRW' ? (
              <p className={`${TEXT_SUB} mt-1`}>
                {t('selectedMethod')}: {t('methodDomestic')}
              </p>
            ) : null}
            <button type="button" disabled={!ready || globalOrder.environment === 'LIVE'} onClick={() => void startPay()} className={`${BTN_PRIMARY} mt-4`}>
              {t('openCheckout')}
            </button>
          </div>
        ) : prep ? (
          <div className={`${CARD_BASE} mt-4`}>
            <p>
              {t('order')} {prep.orderNo}
            </p>
            <p>
              {prep.tossAmount} {prep.currency} · {prep.credits + prep.bonusCredits} {t('creditsUnit')}
            </p>
            <fieldset className="mt-4 flex flex-col gap-2" data-testid="toss-overseas-method">
              <legend className="mb-1 text-sm font-semibold text-gray-800">{t('selectedMethod')}</legend>
              {OVERSEAS_METHODS.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="toss-overseas-method"
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    data-testid={`toss-pay-method-${m}`}
                  />
                  {t(METHOD_LABEL[m])}
                </label>
              ))}
              {method === 'OVERSEAS_EASY_PAY' && (
                <label className="mt-1 flex flex-col gap-1 text-sm">
                  {t('payCountry')}
                  <select
                    className="rounded border px-3 py-2"
                    value={country}
                    onChange={(event) => {
                      countryTouched.current = true
                      setCountry(event.target.value)
                    }}
                    data-testid="toss-pay-country"
                  >
                    {(countryParam && !overseasCountryOptions(accountCountry).includes(countryParam)
                      ? [countryParam, ...overseasCountryOptions(accountCountry)]
                      : overseasCountryOptions(accountCountry)
                    ).map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </fieldset>
            <button type="button" disabled={!ready} onClick={() => void startPay()} className={`${BTN_PRIMARY} mt-4`}>
              {t('openCheckout')}
            </button>
          </div>
        ) : (
          <p className={`${TEXT_SUB} mt-4`}>{t('preparing')}</p>
        )}
        <Link href="/credits/charge" className={`${BTN_SECONDARY} mt-4 inline-block`}>
          {t('backToPackages')}
        </Link>
      </div>
    </div>
  )
}

function CheckoutLoading() {
  const t = useTranslations('common')
  return <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
}

export default function TossCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <TossCheckoutContent />
    </Suspense>
  )
}
