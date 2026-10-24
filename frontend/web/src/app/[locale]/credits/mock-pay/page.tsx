'use client'

/**
 * 목 결제 UI → 백엔드 `POST /api/payments/callback/success|fail` 만 호출.
 * (Next `app/api/...` + Prisma 로 콜백/지급을 다시 만들지 않음 — Spring PaymentOrderService 가 SSOT)
 */
import { useEffect, useState, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { ApiFetchError } from '@/shared/api/apiFetch'
import { creditsApi, type CreditOrderSummary, isMockPaymentUiEnabled } from '@/shared/api/credits'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/shared/ui/specClasses'
import { formatCurrency } from '@/shared/money/currency'

function MockPayContent() {
  const router = useRouter()
  /** 현재 locale (표시·로그용). 네비게이션은 `next-intl` 의 `useRouter`에 **locale 없는 경로**만 넘김 → `/ko` 이중 프리픽스 방지 */
  const locale = useLocale()
  const t = useTranslations('mockPay')
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
          setError(t('loadFail'))
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
      let msg = t('successFail')
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
      alert(t('payFailAlert'))
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
      let msg = t('failFail')
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
      alert(t('failErrAlert'))
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
            <h1 className={TITLE_PAGE}>{t('disabledTitle')}</h1>
            <p className={TEXT_SUB}>{t('disabledHint')}</p>
            <Link href="/credits" className={`${BTN_SECONDARY} mt-4 inline-block`}>
              {t('creditsHome')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <h1 className={TITLE_PAGE}>{t('title')}</h1>
        <p className={TEXT_SUB}>{t('subtitle')}</p>
        {pendingAction && (
          <div
            role="status"
            aria-live="polite"
            className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <p className="font-semibold">{t('processing')}</p>
            <p className="mt-1">{t('processingHint')}</p>
          </div>
        )}

        {!orderNo && (
          <div className={CARD_BASE}>
            <p className="text-sm text-red-600">{t('orderNoRequired')}</p>
            <Link href="/credits/charge" className={`${BTN_PRIMARY} mt-4 inline-block`}>
              {t('backToCharge')}
            </Link>
          </div>
        )}

        {orderNo && loading && <p className={TEXT_SUB}>{t('loading')}</p>}

        {orderNo && !loading && order && (
          <div className={CARD_BASE}>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">{t('order')}</h2>
            <ul className={`space-y-1 ${TEXT_SUB}`}>
              <li>{t('orderNo', { v: order.orderNo })}</li>
              <li>{t('status', { v: order.status })}</li>
              <li>
                {t('amount')} {formatCurrency(Number(order.amount))} {order.currency}
              </li>
              <li>
                {t('creditsLine', { c: order.credits, b: order.bonusCredits })}
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={isCallbackLocked || order.status === 'PAID'}
                onClick={onSuccess}
                className={BTN_PRIMARY}
              >
                {pendingAction === 'success' ? t('successPending') : t('successBtn')}
              </button>
              <button
                type="button"
                disabled={isCallbackLocked || order.status === 'PAID' || order.status === 'FAILED'}
                onClick={onFail}
                className={`${BTN_SECONDARY} border border-red-200 bg-red-50 text-red-800`}
              >
                {pendingAction === 'fail' ? t('failPending') : t('failBtn')}
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
            {t('toCheckoutLocked')}
          </span>
        ) : (
          <Link href="/credits/checkout" className={`${BTN_SECONDARY} inline-block text-sm`}>
            {t('toCheckout')}
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
