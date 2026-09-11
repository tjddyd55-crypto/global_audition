'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Script from 'next/script'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { creditsApi, type PreparePaymentResult } from '@/shared/api/credits'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

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
      setError('packageId 또는 orderNo가 필요합니다.')
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
          setError('packageId 또는 orderNo가 필요합니다.')
          return
        }
        const created = await creditsApi.preparePayment(packageId, 'TOSS_PAYMENTS')
        if (!cancelled) setPrep(created)
      } catch (e: unknown) {
        const ax = e as { response?: { data?: { message?: string } } }
        if (!cancelled) setError(ax.response?.data?.message ?? '토스 주문을 만들 수 없습니다.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [packageId, orderNoParam, router])

  const startPay = async () => {
    if (!prep?.clientKey || !prep.tossAmount || !prep.orderNo) {
      setError('결제 준비 정보가 없습니다.')
      return
    }
    if (!window.TossPayments) {
      setError('토스 결제 스크립트를 불러오지 못했습니다.')
      return
    }
    const origin = window.location.origin
    const successUrl = `${origin}/credits/toss/success`
    const failUrl = `${origin}/credits/result/fail`
    try {
      const toss = window.TossPayments(prep.clientKey)
      const payment = toss.payment({ customerKey: prep.orderNo })
      await payment.requestPayment({
        method: 'CARD',
        amount: { currency: prep.currency || 'USD', value: prep.tossAmount },
        orderId: prep.orderNo,
        orderName: prep.orderName || prep.packageName,
        successUrl,
        failUrl,
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '결제창을 열 수 없습니다.')
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
        <h1 className={TITLE_PAGE}>토스 결제</h1>
        <p className={`${TEXT_SUB} mt-2`}>금액은 서버가 패키지에서 확정합니다. 클라이언트 금액을 신뢰하지 않습니다.</p>
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {prep ? (
          <div className={`${CARD_BASE} mt-4`}>
            <p>주문 {prep.orderNo}</p>
            <p>
              {prep.tossAmount} {prep.currency} · {prep.credits + prep.bonusCredits} 크레딧
            </p>
            <button type="button" disabled={!ready} onClick={() => void startPay()} className={`${BTN_PRIMARY} mt-4`}>
              토스 결제창 열기
            </button>
          </div>
        ) : (
          <p className={`${TEXT_SUB} mt-4`}>주문을 준비하는 중…</p>
        )}
        <Link href="/credits/charge" className={`${BTN_SECONDARY} mt-4 inline-block`}>
          상품으로
        </Link>
      </div>
    </div>
  )
}

export default function TossCheckoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">불러오는 중…</div>}>
      <TossCheckoutContent />
    </Suspense>
  )
}
