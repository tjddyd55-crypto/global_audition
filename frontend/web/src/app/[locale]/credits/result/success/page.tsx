'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { creditsApi, type CreditOrderSummary } from '@/shared/api/credits'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/shared/ui/specClasses'
import { formatCreditsCount } from '@/shared/money/creditsDisplay'

function SuccessContent() {
  const t = useTranslations('payments')
  const tCredits = useTranslations('credits')
  const searchParams = useSearchParams()
  const orderNo = searchParams.get('orderNo')?.trim() ?? ''

  const [order, setOrder] = useState<CreditOrderSummary | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!orderNo || !authApi.getToken()) return
    let c = false
    ;(async () => {
      try {
        const [o, b] = await Promise.all([creditsApi.getOrder(orderNo), creditsApi.getBalance()])
        if (!c) {
          setOrder(o)
          setBalance(b.balance)
        }
      } catch {
        if (!c) setErr(t('loadInfoFailed'))
      }
    })()
    return () => {
      c = true
    }
  }, [orderNo, t])

  const granted = order ? order.credits + order.bonusCredits : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <h1 className={TITLE_PAGE}>{t('chargeComplete')}</h1>
        <div className={CARD_BASE}>
          {orderNo && <p className={`${TEXT_SUB} mb-2`}>{t('orderNo')}</p>}
          {orderNo && <p className="font-mono text-sm text-gray-900">{orderNo}</p>}
          {granted != null && (
            <p className="mt-4 text-lg font-semibold text-green-700">
              {t('grantedCreditsLabel', { n: formatCreditsCount(granted) })}
            </p>
          )}
          {balance != null && (
            <p className={`${TEXT_SUB} mt-2`}>{t('currentBalanceLabel', { n: formatCreditsCount(balance) })}</p>
          )}
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/credits" className={BTN_PRIMARY}>
              {tCredits('home')}
            </Link>
            <Link href="/credits" className={BTN_SECONDARY}>
              {t('viewBalance')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreditSuccessPage() {
  const tCommon = useTranslations('common')
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50">{tCommon('loading')}</div>}>
      <SuccessContent />
    </Suspense>
  )
}
