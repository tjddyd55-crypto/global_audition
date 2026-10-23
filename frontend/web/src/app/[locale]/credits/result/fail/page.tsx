'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link, useRouter } from '../../../../../i18n.config'
import { isTossCancelCode } from '@/shared/payments/tossCancel'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

function FailContent() {
  const t = useTranslations('payments')
  const tCredits = useTranslations('credits')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const searchParams = useSearchParams()
  const orderNo = (searchParams.get('orderNo') ?? searchParams.get('orderId'))?.trim() ?? ''
  const code = searchParams.get('code')?.trim() ?? ''
  const reason = searchParams.get('reason')?.trim() || searchParams.get('message')?.trim() || t('unknownReason')

  useEffect(() => {
    if (isTossCancelCode(code)) {
      const q = new URLSearchParams()
      if (orderNo) q.set('orderNo', orderNo)
      if (reason) q.set('reason', reason)
      router.replace(`/credits/result/cancel?${q.toString()}`)
    }
  }, [code, orderNo, reason, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6`}>
        <h1 className={TITLE_PAGE}>{t('fail')}</h1>
        <div className={CARD_BASE}>
          {orderNo && (
            <p className={TEXT_SUB}>
              {t('orderNo')} <span className="font-mono text-gray-800">{orderNo}</span>
            </p>
          )}
          <p className="mt-4 text-sm text-red-700">{t('reasonLabel', { reason })}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/credits/charge" className={BTN_PRIMARY}>
              {tCommon('retry')}
            </Link>
            <Link href="/credits" className={BTN_SECONDARY}>
              {tCredits('home')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreditFailPage() {
  const tCommon = useTranslations('common')
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50">{tCommon('loading')}</div>}>
      <FailContent />
    </Suspense>
  )
}
