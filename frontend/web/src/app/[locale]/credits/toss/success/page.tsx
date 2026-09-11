'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRouter, Link } from '../../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { creditsApi } from '@/shared/api/credits'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER } from '@/shared/ui/specClasses'

function TossSuccessContent() {
  const router = useRouter()
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
      setError('결제 성공 파라미터가 올바르지 않습니다.')
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
        const ax = e as { response?: { data?: { message?: string } } }
        if (!cancelled) setError(ax.response?.data?.message ?? '결제 승인에 실패했습니다. 크레딧은 지급되지 않았습니다.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [amountRaw, orderId, paymentKey, router])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-10`}>
        <div className={CARD_BASE}>
          {error ? (
            <>
              <p className="text-sm text-red-600">{error}</p>
              <Link href="/credits/charge" className={`${BTN_PRIMARY} mt-4 inline-block`}>
                다시 충전
              </Link>
            </>
          ) : (
            <p>결제를 승인하는 중…</p>
          )}
          <Link href="/credits" className={`${BTN_SECONDARY} mt-4 inline-block`}>
            크레딧 홈
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TossSuccessPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">불러오는 중…</div>}>
      <TossSuccessContent />
    </Suspense>
  )
}
