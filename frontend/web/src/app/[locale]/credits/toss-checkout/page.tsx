'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { creditsApi, type PreparePaymentResult } from '@/shared/api/credits'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'
import { useLocale, useTranslations } from 'next-intl'

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
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

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
  }, [packageId, orderNoParam, router])

  const startPay = async () => {
    if (!prep?.clientKey || !prep.tossAmount || !prep.orderNo) {
      setError(t('missingPrep'))
      return
    }
    if (!window.TossPayments) {
      setError(t('scriptFailed'))
      return
    }
    const origin = window.location.origin
    const successUrl = `${origin}/${locale}/credits/toss/success`
    const failUrl = `${origin}/${locale}/credits/result/fail`
    try {
      const toss = window.TossPayments(prep.clientKey)
      const payment = toss.payment({ customerKey: prep.orderNo })
      await payment.requestPayment({
        method: prep.tossMethod || 'FOREIGN_EASY_PAY',
        amount: { currency: prep.currency || 'USD', value: prep.tossAmount },
        orderId: prep.orderNo,
        orderName: prep.orderName || prep.packageName,
        successUrl,
        failUrl,
        foreignEasyPay: { provider: prep.foreignEasyPayProvider || 'PAYPAL' },
        ...(prep.variantKey ? { variantKey: prep.variantKey } : {}),
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('createFailed'))
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
        {prep ? (
          <div className={`${CARD_BASE} mt-4`}>
            <p>
              {t('order')} {prep.orderNo}
            </p>
            <p>
              {prep.tossAmount} {prep.currency} · {prep.credits + prep.bonusCredits} {t('creditsUnit')}
            </p>
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
