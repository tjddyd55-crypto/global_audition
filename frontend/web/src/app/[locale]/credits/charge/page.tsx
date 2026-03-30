'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/lib/api/auth'
import { creditsApi, type CreditPackageCatalogItem } from '@/lib/api/credits'
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

export default function CreditsChargePage() {
  const router = useRouter()
  const [packages, setPackages] = useState<CreditPackageCatalogItem[]>([])
  const [selectedPackage, setSelectedPackage] = useState<CreditPackageCatalogItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authApi.getToken()) {
      router.push('/login')
      return
    }

    let cancelled = false
    ;(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const list = await creditsApi.listPackages()
        if (cancelled) return
        setPackages(list)
      } catch {
        if (!cancelled) {
          setError('패키지 목록을 불러오지 못했습니다.')
          setPackages([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router])

  const goCheckout = () => {
    if (!selectedPackage) return
    router.push(`/credits/checkout?packageId=${encodeURIComponent(selectedPackage.id)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={TITLE_PAGE}>크레딧 충전</h1>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/credits" className={`${BTN_SECONDARY} text-center text-sm`}>
              크레딧 홈
            </Link>
          </div>
        </div>

        <p className={TEXT_SUB}>충전할 상품을 선택한 뒤 결제 단계로 이동합니다. (PG 연동 전까지 실제 결제는 진행되지 않습니다.)</p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {isLoading ? (
          <p className={TEXT_SUB}>불러오는 중…</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {packages.map((p) => {
              const selected = selectedPackage?.id === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPackage(p)}
                  className={`${CARD_BASE} text-left transition ring-offset-2 ${
                    selected ? 'border-[#3B82F6] ring-2 ring-[#3B82F6]' : 'border-[#E5E7EB] hover:border-gray-300'
                  }`}
                >
                  <p className="text-base font-semibold text-gray-900">{p.name}</p>
                  <p className="mt-2 text-2xl font-bold text-[#3B82F6]">{formatCurrency(p.price)}</p>
                  <p className={`${TEXT_SUB} mt-2`}>
                    기본 {formatCreditsCount(p.credits)} 크레딧
                    {p.bonusCredits > 0 && (
                      <span className="ml-1 font-medium text-green-600">
                        + 보너스 {formatCreditsCount(p.bonusCredits)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    총 {formatCreditsCount(p.credits + p.bonusCredits)} 크레딧 지급
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {!isLoading && packages.length === 0 && !error && (
          <p className={TEXT_SUB}>판매 중인 패키지가 없습니다.</p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!selectedPackage}
            onClick={goCheckout}
            className={BTN_PRIMARY}
          >
            결제하기
          </button>
        </div>
      </div>
    </div>
  )
}
