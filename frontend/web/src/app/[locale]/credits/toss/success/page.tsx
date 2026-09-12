'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '../../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { creditsApi } from '@/shared/api/credits'
import { mapApiErrorCode } from '@/shared/i18n/mapApiError'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER } from '@/shared/ui/specClasses'

function TossSuccessContent() {
  const router = useRouter()
  const t = useTranslations('payments')
  const tCredits = useTranslations('credits')
  const tErr = useTranslations()
  const searchParams = useSearchParams()
  const paymentKey = searchParams.get('paymentKey')?.trim() ?? ''
  const orderId = searchParams.get('orderId')?.trim() ?? ''
  const amountRaw = searchParams.get('amount')?.trim() ?? ''
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authApi.getToken()) {
      router.push('/login')
      return
    }
    const amount = Number(amountRaw)
    if (!paymentKey || !orderId || !Number.isFinite(amount)) {
      setError(t('successParamsInvalid'))
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await creditsApi.confirmToss({ paymentKey, orderId, amount })
        if (!cancelled) {
          router.replace(`/credits/result/success?orderNo=${encodeURIComponent(orderId)}`)
        }
      } catch (e: unknown) {
        const ax = e as { response?: { data?: unknown } }
        if (!cancelled) {
          setError(mapApiErrorCode(ax.response?.data, (key) => tErr(key), t('confirmFailed')))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [amountRaw, orderId, paymentKey, router, t, tErr])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-10`}>
        <div className={CARD_BASE}>
          {error ? (
            <>
              <p className="text-sm text-red-600">{error}</p>
              <Link href="/credits/charge" className={`${BTN_PRIMARY} mt-4 inline-block`}>
                {t('retryCharge')}
              </Link>
            </>
          ) : (
            <p>{t('confirming')}</p>
          )}
          <Link href="/credits" className={`${BTN_SECONDARY} mt-4 inline-block`}>
            {tCredits('home')}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TossSuccessPage() {
  const tCommon = useTranslations('common')
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">{tCommon('loading')}</div>}>
      <TossSuccessContent />
    </Suspense>
  )
}
