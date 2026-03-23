'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Link } from '../../../../../i18n.config'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB, TITLE_PAGE } from '@/lib/ui/specClasses'

function FailContent() {
  const searchParams = useSearchParams()
  const orderNo = searchParams.get('orderNo')?.trim() ?? ''
  const reason = searchParams.get('reason')?.trim() ?? '알 수 없음'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6`}>
        <h1 className={TITLE_PAGE}>결제 실패</h1>
        <div className={CARD_BASE}>
          {orderNo && (
            <p className={TEXT_SUB}>
              주문번호 <span className="font-mono text-gray-800">{orderNo}</span>
            </p>
          )}
          <p className="mt-4 text-sm text-red-700">사유: {reason}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/credits/charge" className={BTN_PRIMARY}>
              다시 시도
            </Link>
            <Link href="/credits" className={BTN_SECONDARY}>
              크레딧 홈
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CreditFailPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50">…</div>}>
      <FailContent />
    </Suspense>
  )
}
