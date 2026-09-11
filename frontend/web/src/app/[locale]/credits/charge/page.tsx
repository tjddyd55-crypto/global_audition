'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link } from '../../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { creditsApi, type CreditPackageCatalogItem } from '@/shared/api/credits'
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
import { formatCreditsCount } from '@/shared/money/creditsDisplay'
import { useTranslations } from 'next-intl'

export default function CreditsChargePage() {
  const t = useTranslations('credits')
  const tPay = useTranslations('payments')
  const tCommon = useTranslations('common')
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
          setError(t('loadFailed'))
          setPackages([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router, t])

  const goCheckout = () => {
    if (!selectedPackage) return
    router.push(`/credits/checkout?packageId=${encodeURIComponent(selectedPackage.id)}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={TITLE_PAGE}>{t('chargeTitle')}</h1>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/credits" className={`${BTN_SECONDARY} text-center text-sm`}>
              {t('home')}
            </Link>
          </div>
        </div>

        <p className={TEXT_SUB}>{t('chargeHint')}</p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {isLoading ? (
          <p className={TEXT_SUB}>{tCommon('loading')}</p>
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
                    {formatCreditsCount(p.credits)} {t('creditUnit')}
                    {p.bonusCredits > 0 && (
                      <span className="ml-1 font-medium text-green-600">
                        + {formatCreditsCount(p.bonusCredits)}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">
                    {formatCreditsCount(p.credits + p.bonusCredits)} {t('creditUnit')}
                  </p>
                </button>
              )
            })}
          </div>
        )}

        {!isLoading && packages.length === 0 && !error && (
          <p className={TEXT_SUB}>{t('emptyPackages')}</p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            disabled={!selectedPackage}
            onClick={goCheckout}
            className={BTN_PRIMARY}
          >
            {tPay('checkout')}
          </button>
        </div>
      </div>
    </div>
  )
}
