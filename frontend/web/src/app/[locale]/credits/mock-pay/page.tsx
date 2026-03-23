'use client'

/**
 * 목 결제 UI → 백엔드 `POST /api/payments/callback/success|fail` 만 호출.
 * (Next `app/api/...` + Prisma 로 콜백/지급을 다시 만들지 않음 — Spring PaymentOrderService 가 SSOT)
 */
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/lib/api/auth'
import { ApiFetchError } from '@/lib/api/apiFetch'
import { creditsApi, type CreditOrderSummary, isMockPaymentUiEnabled } from '@/lib/api/credits'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'

function MockPayContent() {
  const router = useRouter()
  /** 현재 locale (표시·로그용). 네비게이션은 `next-intl` 의 `useRouter`에 **locale 없는 경로**만 넘김 → `/ko` 이중 프리픽스 방지 */
  const locale = useLocale()
  const searchParams = useSearchParams()
  const orderNo = searchParams.get('orderNo')?.trim() ?? ''

  const [order, setOrder] = useState<CreditOrderSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  /** 콜백 요청 중 — 완료 전까지 버튼 비활성화(중복 클릭·PG UX 정합) */
  const [pendingAction, setPendingAction] = useState<null | 'success' | 'fail'>(null)

  useEffect(() => {
    if (!isMockPaymentUiEnabled()) {
      setLoading(false)
      return
    }
    if (!authApi.getToken()) {
      router.push('/login')
      return
    }
    if (!orderNo) {
      setLoading(false)
      return
    }
    let c = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const o = await creditsApi.getOrder(orderNo)
        if (!c) setOrder(o)
      } catch {
        if (!c) {
          setError('주문을 불러오지 못했습니다.')
          setOrder(null)
        }
      } finally {
        if (!c) setLoading(false)
      }
    })()
    return () => {
      c = true
    }
  }, [router, orderNo])

  const onSuccess = async () => {
    if (!orderNo || pendingAction !== null) return
    setPendingAction('success')
    setError(null)
    try {
      // 반드시 콜백 완료 후 이동 (DB 반영 전에 result 로 가면 안 됨)
      await creditsApi.paymentSuccessCallback({
        orderNo,
        providerTxId: `MOCK-${Date.now()}`,
        payload: { source: 'MOCK_UI', locale },
      })
      router.push(`/credits/result/success?orderNo=${encodeURIComponent(orderNo)}`)
    } catch (e: unknown) {
      let msg = '성공 처리에 실패했습니다.'
      if (e instanceof ApiFetchError) {
        console.error('[mock-pay] success callback', e.status, e.bodyText)
        msg = e.bodyText || msg
      } else {
        console.error('[mock-pay] success callback', e)
      }
      setError(msg)
    } finally {
      setPendingAction(null)
    }
  }

  const onFail = async () => {
    if (!orderNo || pendingAction !== null) return
    setPendingAction('fail')
    setError(null)
    try {
      await creditsApi.paymentFailCallback({
        orderNo,
        reason: 'USER_CANCEL_MOCK',
        payload: { source: 'MOCK_UI', locale },
      })
      router.push(
        `/credits/result/fail?orderNo=${encodeURIComponent(orderNo)}&reason=${encodeURIComponent('USER_CANCEL_MOCK')}`,
      )
    } catch (e: unknown) {
      let msg = '실패 처리에 실패했습니다.'
      if (e instanceof ApiFetchError) {
        console.error('[mock-pay] fail callback', e.status, e.bodyText)
        msg = e.bodyText || msg
      } else {
        console.error('[mock-pay] fail callback', e)
      }
      setError(msg)
    } finally {
      setPendingAction(null)
    }
  }

  if (!isMockPaymentUiEnabled()) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className={`${PAGE_CONTAINER} py-6`}>
          <div className={CARD_BASE}>
            <h1 className={TITLE_PAGE}>목 결제 비활성화</h1>
            <p className={TEXT_SUB}>NEXT_PUBLIC_CREDIT_MOCK_PAYMENT=true 로 켠 뒤 다시 시도하세요.</p>
            <Link href="/credits" className={`${BTN_SECONDARY} mt-4 inline-block`}>
              크레딧 홈
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <h1 className={TITLE_PAGE}>목 결제 (PG 연동 전)</h1>
        <p className={TEXT_SUB}>실제 과금 없이 성공/실패 콜백만 테스트합니다.</p>
        {pendingAction && (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            결제 콜백 처리 중… (서버 반영 후 결과 페이지로 이동합니다)
          </p>
        )}

        {!orderNo && (
          <div className={CARD_BASE}>
            <p className="text-sm text-red-600">orderNo 가 필요합니다.</p>
            <Link href="/credits/charge" className={`${BTN_PRIMARY} mt-4 inline-block`}>
              충전으로 돌아가기
            </Link>
          </div>
        )}

        {orderNo && loading && <p className={TEXT_SUB}>불러오는 중…</p>}

        {orderNo && !loading && order && (
          <div className={CARD_BASE}>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">주문</h2>
            <ul className={`space-y-1 ${TEXT_SUB}`}>
              <li>주문번호 {order.orderNo}</li>
              <li>상태 {order.status}</li>
              <li>금액 {order.amount.toLocaleString('ko-KR')} {order.currency}</li>
              <li>
                크레딧 {order.credits} + 보너스 {order.bonusCredits}
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={pendingAction !== null || order.status === 'PAID'}
                onClick={onSuccess}
                className={BTN_PRIMARY}
              >
                {pendingAction === 'success' ? '성공 콜백 처리 중…' : '결제 성공 (목)'}
              </button>
              <button
                type="button"
                disabled={pendingAction !== null || order.status === 'PAID' || order.status === 'FAILED'}
                onClick={onFail}
                className={`${BTN_SECONDARY} border border-red-200 bg-red-50 text-red-800`}
              >
                {pendingAction === 'fail' ? '실패 콜백 처리 중…' : '결제 실패 (목)'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Link href="/credits/checkout" className={`${BTN_SECONDARY} inline-block text-sm`}>
          결제 확인으로
        </Link>
      </div>
    </div>
  )
}

export default function MockPayPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50">…</div>}>
      <MockPayContent />
    </Suspense>
  )
}
