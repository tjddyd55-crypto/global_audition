'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/lib/api/auth'
import { creditsApi, type CreditPackageCatalogItem, type PreparePaymentResult } from '@/lib/api/credits'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packageId = searchParams.get('packageId')?.trim() ?? ''

  const [selectedPackage, setSelectedPackage] = useState<CreditPackageCatalogItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [prepareResult, setPrepareResult] = useState<PreparePaymentResult | null>(null)
  const [prepareError, setPrepareError] = useState<string | null>(null)
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
      setPrepareResult(null)
      setPrepareError(null)
      try {
        const pkg = await creditsApi.getPackage(packageId)
        if (cancelled) return
        setSelectedPackage(pkg)
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
  }, [router, packageId])

  const onPreparePayment = async () => {
    if (!packageId) return
    setIsPreparing(true)
    setPrepareError(null)
    setPrepareResult(null)
    try {
      const res = await creditsApi.preparePayment(packageId)
      setPrepareResult(res)
    } catch (e: unknown) {
      let msg = '결제 준비 요청에 실패했습니다.'
      if (axios.isAxiosError(e)) {
        const data = e.response?.data as { message?: string } | undefined
        if (data?.message && typeof data.message === 'string') msg = data.message
      }
      setPrepareError(msg)
    } finally {
      setIsPreparing(false)
    }
  }

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
            <h2 className={`${TITLE_PAGE} mb-4`}>선택한 상품</h2>
            <p className="text-base font-semibold text-gray-900">{selectedPackage.name}</p>
            <ul className={`mt-3 flex flex-col gap-1 ${TEXT_SUB}`}>
              <li>결제 금액: {selectedPackage.price.toLocaleString('ko-KR')}원</li>
              <li>크레딧: {selectedPackage.credits.toLocaleString('ko-KR')}</li>
              {selectedPackage.bonusCredits > 0 && (
                <li className="font-medium text-green-600">
                  보너스: +{selectedPackage.bonusCredits.toLocaleString('ko-KR')}
                </li>
              )}
            </ul>

            <button
              type="button"
              disabled={isPreparing}
              onClick={onPreparePayment}
              className={`${BTN_PRIMARY} mt-6`}
            >
              {isPreparing ? '처리 중…' : '결제하기'}
            </button>

            {prepareError && (
              <p className="mt-3 text-sm text-red-600">{prepareError}</p>
            )}

            {prepareResult && (
              <div className="mt-6 rounded-lg border border-[#E5E7EB] bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">결제 준비 완료 (모의)</p>
                <p className={`${TEXT_SUB} mt-2`}>{prepareResult.message}</p>
                <pre className="mt-3 max-h-48 overflow-auto rounded-md bg-white p-3 text-xs text-gray-800">
                  {JSON.stringify(prepareResult, null, 2)}
                </pre>
              </div>
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
