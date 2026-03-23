'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '../../../../../i18n.config'
import { authApi } from '@/lib/api/auth'
import { creditsApi, type CreditOrderSummary } from '@/lib/api/credits'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'

function SuccessContent() {
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
        if (!c) setErr('정보를 불러오지 못했습니다.')
      }
    })()
    return () => {
      c = true
    }
  }, [orderNo])

  const granted = order ? order.credits + order.bonusCredits : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <h1 className={TITLE_PAGE}>충전 완료</h1>
        <div className={CARD_BASE}>
          {orderNo && <p className={`${TEXT_SUB} mb-2`}>주문번호</p>}
          {orderNo && <p className="font-mono text-sm text-gray-900">{orderNo}</p>}
          {granted != null && (
            <p className="mt-4 text-lg font-semibold text-green-700">
              지급 크레딧 {granted.toLocaleString('ko-KR')} C
            </p>
          )}
          {balance != null && (
            <p className={`${TEXT_SUB} mt-2`}>현재 잔액 {balance.toLocaleString('ko-KR')} C</p>
          )}
          {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/credits" className={BTN_PRIMARY}>
              크레딧 홈
            </Link>
            <Link href="/credits" className={BTN_SECONDARY}>
              잔액·내역 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreditSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50">…</div>}>
      <SuccessContent />
    </Suspense>
  )
}
