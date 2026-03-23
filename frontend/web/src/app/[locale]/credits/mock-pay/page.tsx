'use client'

/**
 * 목 결제 UI → 백엔드 `POST /api/payments/callback/success|fail` 만 호출.
 * (Next `app/api/...` + Prisma 로 콜백/지급을 다시 만들지 않음 — Spring PaymentOrderService 가 SSOT)
 */
import { useEffect, useState, Suspense, useRef } from 'react'
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
  /** 콜백 요청 중 — 완료 전까지 전 버튼·이탈 링크 잠금(모바일 더블탭·느린 네트워크) */
  const [pendingAction, setPendingAction] = useState<null | 'success' | 'fail'>(null)
  const isCallbackLocked = pendingAction !== null
  /** 리렌더 전 동시 더블탭 차단 */
  const callbackInFlightRef = useRef(false)

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
    if (!orderNo || isCallbackLocked || callbackInFlightRef.current) return
    callbackInFlightRef.current = true
    setPendingAction('success')
    setError(null)
    try {
      await creditsApi.paymentSuccessCallback({
        orderNo,
        providerTxId: `MOCK-${Date.now()}`,
        payload: { source: 'MOCK_UI', locale },
      })
      // 위 await 가 성공한 경우에만 실행. catch 에서는 절대 success 페이지로 이동하지 않음.
      router.push(`/credits/result/success?orderNo=${encodeURIComponent(orderNo)}`)
    } catch (e: unknown) {
      let msg = '성공 처리에 실패했습니다.'
      if (e instanceof ApiFetchError) {
        console.error('[mock-pay] success callback', {
          status: e.status,
          body: e.bodyText,
          url: e.url,
        })
        msg = e.bodyText || msg
      } else {
        console.error('[mock-pay] success callback', e)
      }
      setError(msg)
      alert('결제 처리에 실패했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      callbackInFlightRef.current = false
      setPendingAction(null)
    }
  }

  const onFail = async () => {
    if (!orderNo || isCallbackLocked || callbackInFlightRef.current) return
    callbackInFlightRef.current = true
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
        console.error('[mock-pay] fail callback', {
          status: e.status,
          body: e.bodyText,
          url: e.url,
        })
        msg = e.bodyText || msg
      } else {
        console.error('[mock-pay] fail callback', e)
      }
      setError(msg)
      alert('결제 실패 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      callbackInFlightRef.current = false
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
          <div
            role="status"
            aria-live="polite"
            className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <p className="font-semibold">결제 처리 중입니다…</p>
            <p className="mt-1">페이지를 닫지 마세요. 서버 반영이 끝나면 결과 화면으로 이동합니다.</p>
          </div>
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
                disabled={isCallbackLocked || order.status === 'PAID'}
                onClick={onSuccess}
                className={BTN_PRIMARY}
              >
                {pendingAction === 'success' ? '성공 콜백 처리 중…' : '결제 성공 (목)'}
              </button>
              <button
                type="button"
                disabled={isCallbackLocked || order.status === 'PAID' || order.status === 'FAILED'}
                onClick={onFail}
                className={`${BTN_SECONDARY} border border-red-200 bg-red-50 text-red-800`}
              >
                {pendingAction === 'fail' ? '실패 콜백 처리 중…' : '결제 실패 (목)'}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        {isCallbackLocked ? (
          <span
            className={`${BTN_SECONDARY} inline-block cursor-not-allowed text-sm opacity-50`}
            aria-disabled
          >
            결제 확인으로 (처리 중에는 이동할 수 없습니다)
          </span>
        ) : (
          <Link href="/credits/checkout" className={`${BTN_SECONDARY} inline-block text-sm`}>
            결제 확인으로
          </Link>
        )}
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
