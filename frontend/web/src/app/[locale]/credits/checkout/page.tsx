'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import axios from 'axios'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import {
  creditsApi,
  type CreditOrderSummary,
  type CreditPackageCatalogItem,
  type PreparePaymentResult,
  isMockPaymentUiEnabled,
} from '@/shared/api/credits'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/shared/ui/specClasses'
import { formatWholeUsd } from '@/shared/money/currency'
import { formatCreditsCount } from '@/shared/money/creditsDisplay'
import { useTranslations } from 'next-intl'

function CheckoutContent() {
  const t = useTranslations('payments')
  const tCommon = useTranslations('common')
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
          setLoadError(t('packageNotFound'))
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router, packageId, orderNoParam, t])

  const onCreateOrder = async () => {
    if (!packageId) return
    setIsPreparing(true)
    setActionError(null)
    try {
      let provider = 'MOCK'
      try {
        const hints = await creditsApi.getCheckoutHints()
        if (hints.enabled) provider = 'TOSS_PAYMENTS'
      } catch {
        provider = 'MOCK'
      }
      const res = await creditsApi.preparePayment(packageId, provider)
      setPrepareResult(res)
      if (res.provider === 'TOSS_PAYMENTS') {
        router.replace(`/credits/toss-checkout?packageId=${encodeURIComponent(packageId)}&orderNo=${encodeURIComponent(res.orderNo)}`)
        return
      }
      router.replace(`/credits/checkout?packageId=${encodeURIComponent(packageId)}&orderNo=${encodeURIComponent(res.orderNo)}`)
    } catch (e: unknown) {
      let msg = t('createOrderFailed')
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
          <h1 className={TITLE_PAGE}>{t('confirmTitle')}</h1>
          <Link href="/credits/charge" className={`${BTN_SECONDARY} text-center text-sm`}>
            {t('reselectPackage')}
          </Link>
        </div>

        {!packageId && (
          <div className={CARD_BASE}>
            <p className="text-sm text-red-600">{t('missingPackage')}</p>
            <Link href="/credits/charge" className={`${BTN_PRIMARY} mt-4 inline-block`}>
              {t('selectPackageCta')}
            </Link>
          </div>
        )}

        {packageId && isLoading && <p className={TEXT_SUB}>{tCommon('loading')}</p>}

        {packageId && !isLoading && !selectedPackage && loadError && (
          <div className={CARD_BASE}>
            <p className="text-sm text-red-600">{loadError}</p>
          </div>
        )}

        {selectedPackage && (
          <div className={CARD_BASE}>
            <h2 className={`${TITLE_PAGE} mb-4`}>{t('orderSummary')}</h2>
            <ul className={`flex flex-col gap-2 ${TEXT_SUB}`}>
              {displayOrderNo && (
                <li>
                  <span className="font-medium text-gray-800">{t('orderNo')}</span> {displayOrderNo}
                </li>
              )}
              <li>
                <span className="font-medium text-gray-800">{t('packageName')}</span> {displayName}
              </li>
              <li>
                <span className="font-medium text-gray-800">{t('payAmount')}</span> {formatWholeUsd(displayAmount ?? 0)}
              </li>
              <li>
                <span className="font-medium text-gray-800">{t('grantCredits')}</span> {formatCreditsCount(displayCredits ?? 0)}
              </li>
              {(displayBonus ?? 0) > 0 && (
                <li className="font-medium text-green-600">{t('bonus', { n: formatCreditsCount(displayBonus ?? 0) })}</li>
              )}
              <li>
                <span className="font-medium text-gray-800">{t('totalGrant', { n: (displayCredits ?? 0) + (displayBonus ?? 0) })}</span>
              </li>
              <li>
                <span className="font-medium text-gray-800">{t('provider')}</span> {displayProvider}
              </li>
              {orderSummary && (
                <li>
                  <span className="font-medium text-gray-800">{t('status')}</span> {orderSummary.status}
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
                {isPreparing ? t('creatingOrder') : t('createOrder')}
              </button>
            )}

            {(orderNoParam || orderSummary) && isMockPaymentUiEnabled() && (
              <button type="button" onClick={goToPayment} className={`${BTN_PRIMARY} mt-4 block`}>
                {t('mockPay')}
              </button>
            )}

            {(orderNoParam || orderSummary) && !isMockPaymentUiEnabled() && (
              <p className={`${TEXT_SUB} mt-4`}>
                {t('pgHint')}
              </p>
            )}

            {actionError && <p className="mt-3 text-sm text-red-600">{actionError}</p>}

            {prepareResult && !orderNoParam && (
              <p className={`${TEXT_SUB} mt-4`}>{t('orderCreated')}</p>
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
        <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500">…</div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
