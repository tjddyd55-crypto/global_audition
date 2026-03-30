'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/lib/api/auth'
import {
  creditsApi,
  type CreditOrderSummary,
  type CreditPackageCatalogItem,
  type PreparePaymentResult,
  isMockPaymentUiEnabled,
} from '@/lib/api/credits'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'
import { formatCurrency } from '@/lib/money/currency'
import { formatCreditsCount } from '@/lib/money/creditsDisplay'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get('packageId')?.trim() ?? ''
  const orderNoParam = searchParams.get('orderNo')?.trim() ?? ''

  const [selectedPackage, setSelectedPackage] = useState<CreditPackageCatalogItem | null>(null)
  const [orderSummary, setOrderSummary] = useState<CreditOrderSummary | null>(null)
  const [prepareResult, setPrepareResult] = useState<PreparePaymentResult | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPreparing, setIsPreparing] = useState(false)

  useEffect(() => {
    if (!authApi.getToken()) {
      router.push('/login')
      return
    }

    if (!packageId) {
      setSelectedPackage(null)
      setIsLoading(false)
      return
    }

    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      setLoadError(null)
      try {
        const pkg = await creditsApi.getPackage(packageId)
        if (cancelled) return
        setSelectedPackage(pkg)
        if (orderNoParam) {
          const ord = await creditsApi.getOrder(orderNoParam)
          if (cancelled) return
          setOrderSummary(ord)
          setPrepareResult(null)
        } else {
          setOrderSummary(null)
          setPrepareResult(null)
        }
      } catch {
        if (!cancelled) {
          setSelectedPackage(null)
          setLoadError('패키지를 찾을 수 없거나 판매 중이 아닙니다.')
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router, packageId, orderNoParam])

  const onCreateOrder = async () => {
    if (!packageId) return
    setIsPreparing(true)
    setActionError(null)
    try {
      const res = await creditsApi.preparePayment(packageId, 'MOCK')
      setPrepareResult(res)
      router.replace(`/credits/checkout?packageId=${encodeURIComponent(packageId)}&orderNo=${encodeURIComponent(res.orderNo)}`)
    } catch (e: unknown) {
      let msg = '주문 생성에 실패했습니다.'
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { message?: string } | undefined
        if (data?.message && typeof data.message === 'string') msg = data.message
      }
      setActionError(msg)
    } finally {
      setIsPreparing(false)
    }
  }

  const goToPayment = () => {
    const path =
      prepareResult?.redirectUrl ??
      (orderNoParam ? `/credits/mock-pay?orderNo=${encodeURIComponent(orderNoParam)}` : null)
    if (path) {
      router.push(path)
    }
  }

  const displayOrderNo = orderSummary?.orderNo ?? prepareResult?.orderNo ?? orderNoParam
  const displayProvider = orderSummary?.provider ?? prepareResult?.provider ?? 'MOCK'
  const displayAmount = orderSummary?.amount ?? selectedPackage?.price
  const displayCredits = orderSummary?.credits ?? selectedPackage?.credits
  const displayBonus = orderSummary?.bonusCredits ?? selectedPackage?.bonusCredits
  const displayName = orderSummary?.packageName ?? selectedPackage?.name

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={TITLE_PAGE}>결제 확인</h1>
          <Link href="/credits/charge" className={`${BTN_SECONDARY} text-center text-sm`}>
            상품 다시 선택
          </Link>
        </div>

        {!packageId && (
          <div className={CARD_BASE}>
            <p className="text-sm text-red-600">packageId가 없습니다. 충전 페이지에서 상품을 선택해 주세요.</p>
            <Link href="/credits/charge" className={`${BTN_PRIMARY} mt-4 inline-block`}>
              충전 상품 선택
            </Link>
          </div>
        )}

        {packageId && isLoading && <p className={TEXT_SUB}>불러오는 중…</p>}

        {packageId && !isLoading && !selectedPackage && loadError && (
          <div className={CARD_BASE}>
            <p className="text-sm text-red-600">{loadError}</p>
          </div>
        )}

        {selectedPackage && (
          <div className={CARD_BASE}>
            <h2 className={`${TITLE_PAGE} mb-4`}>주문 요약</h2>
            <ul className={`flex flex-col gap-2 ${TEXT_SUB}`}>
              {displayOrderNo && (
                <li>
                  <span className="font-medium text-gray-800">주문번호</span> {displayOrderNo}
                </li>
              )}
              <li>
                <span className="font-medium text-gray-800">패키지</span> {displayName}
              </li>
              <li>
                <span className="font-medium text-gray-800">결제 금액</span> {formatCurrency(displayAmount ?? 0)}
              </li>
              <li>
                <span className="font-medium text-gray-800">지급 크레딧</span> {formatCreditsCount(displayCredits ?? 0)}
              </li>
              {(displayBonus ?? 0) > 0 && (
                <li className="font-medium text-green-600">보너스 +{formatCreditsCount(displayBonus ?? 0)}</li>
              )}
              <li>
                <span className="font-medium text-gray-800">총 지급 예정</span>{' '}
                {(displayCredits ?? 0) + (displayBonus ?? 0)} 크레딧
              </li>
              <li>
                <span className="font-medium text-gray-800">Provider</span> {displayProvider}
              </li>
              {orderSummary && (
                <li>
                  <span className="font-medium text-gray-800">상태</span> {orderSummary.status}
                </li>
              )}
            </ul>

            {!orderNoParam && !orderSummary && (
              <button
                type="button"
                disabled={isPreparing}
                onClick={onCreateOrder}
                className={`${BTN_PRIMARY} mt-6`}
              >
                {isPreparing ? '주문 생성 중…' : '주문 생성하기'}
              </button>
            )}

            {(orderNoParam || orderSummary) && isMockPaymentUiEnabled() && (
              <button type="button" onClick={goToPayment} className={`${BTN_PRIMARY} mt-4 block`}>
                결제 진행 (목)
              </button>
            )}

            {(orderNoParam || orderSummary) && !isMockPaymentUiEnabled() && (
              <p className={`${TEXT_SUB} mt-4`}>
                실제 PG 연동 시 이 단계에서 결제사 화면으로 이동합니다. (목 결제 비활성화됨)
              </p>
            )}

            {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

            {prepareResult && !orderNoParam && (
              <p className={`${TEXT_SUB} mt-4`}>주문이 생성되었습니다. URL이 갱신되면 결제 진행을 눌러 주세요.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CreditsCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">불러오는 중…</div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
