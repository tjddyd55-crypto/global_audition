'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

function CancelContent() {
  const t = useTranslations('payments')
  const tCredits = useTranslations('credits')
  const searchParams = useSearchParams()
  const orderNo = (searchParams.get('orderNo') ?? searchParams.get('orderId'))?.trim() ?? ''

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6`}>
        <h1 className={TITLE_PAGE}>{t('cancel')}</h1>
        <div className={CARD_BASE}>
          {orderNo && (
            <p className={TEXT_SUB}>
              {t('orderNo')} <span className="font-mono text-gray-800">{orderNo}</span>
            </p>
          )}
          <p className="mt-4 text-sm text-gray-800">{t('cancelledOnly')}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/credits/charge" className={BTN_PRIMARY}>
              {t('retryCharge')}
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

export default function CreditCancelPage() {
  const tCommon = useTranslations('common')
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50">{tCommon('loading')}</div>}>
      <CancelContent />
    </Suspense>
  )
}
