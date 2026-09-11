'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, Link } from '../../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { creditsApi, type CreditTransactionItem } from '@/shared/api/credits'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/shared/ui/specClasses'

import { formatCreditsCount } from '@/shared/money/creditsDisplay'

function formatSignedCredits(amount: number) {
  const s = formatCreditsCount(amount)
  return amount > 0 ? `+${s}` : s
}

export default function CreditsDashboardPage() {
  const t = useTranslations('credits')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<CreditTransactionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')

  const typeLabel = (type: string) => {
    if (type === 'CHARGE') return t('typeCharge')
    if (type === 'USE') return t('typeUse')
    if (type === 'GRANT') return t('typeGrant')
    return type
  }

  const reasonSummary = (type: string, reason: string, referenceId: string | null) => {
    if (type === 'USE' && reason === 'AUDITION_APPLY' && referenceId) {
      return t('applyRef', { id: referenceId.slice(0, 8) })
    }
    if (type === 'CHARGE' && reason === 'PACKAGE_PURCHASE') {
      return t('packageCharge')
    }
    return reason
  }

  const filters = [
    { value: '', label: t('all') },
    { value: 'CHARGE', label: t('typeCharge') },
    { value: 'USE', label: t('typeUse') },
    { value: 'GRANT', label: t('typeGrant') },
  ] as const

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
        const [balRes, txRes] = await Promise.all([
          creditsApi.getBalance(),
          creditsApi.getTransactions(0, 50, typeFilter.trim() || undefined),
        ])
        if (cancelled) return
        setBalance(balRes.balance)
        setTransactions(txRes.content ?? [])
      } catch {
        if (!cancelled) {
          setError(t('loadHomeFailed'))
          setBalance(null)
          setTransactions([])
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [router, typeFilter, t])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={TITLE_PAGE}>{t('title')}</h1>
          <Link href="/my/dashboard" className={`${BTN_SECONDARY} text-center text-sm`}>
            {t('dashboard')}
          </Link>
        </div>

        <div className={CARD_BASE}>
          <p className={`${TEXT_SUB} mb-2`}>{t('currentBalance')}</p>
          {isLoading ? (
            <p className="text-2xl font-semibold text-gray-400">{tCommon('loading')}</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-4xl font-bold tracking-tight text-[#3B82F6]">
              {formatCreditsCount(balance ?? 0)}
              <span className="ml-2 text-lg font-semibold text-gray-600">C</span>
            </p>
          )}
          <div className="mt-6">
            <Link href="/credits/charge" className={BTN_PRIMARY}>
              {t('charge')}
            </Link>
          </div>
        </div>

        <div className={CARD_BASE}>
          <h2 className={`${TITLE_PAGE} mb-1`}>{t('ledgerTitle')}</h2>
          <p className={`${TEXT_SUB} mb-3`}>{t('ledgerHint')}</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f.value || 'all'}
                type="button"
                onClick={() => setTypeFilter(f.value)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  typeFilter === f.value
                    ? 'border-[#3B82F6] bg-[#3B82F6] text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {isLoading ? (
            <p className={TEXT_SUB}>{tCommon('loading')}</p>
          ) : transactions.length === 0 ? (
            <p className={TEXT_SUB}>{t('emptyTx')}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[#E5E7EB]">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {typeLabel(tx.type)} · {reasonSummary(tx.type, tx.reason, tx.referenceId ?? null)}
                    </p>
                    <p className={TEXT_SUB}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}
                      {tx.referenceId ? (
                        <span className="mt-0.5 block font-mono text-[11px] text-gray-400">
                          ref: {tx.referenceId}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatSignedCredits(tx.amount)}
                    </p>
                    {tx.afterBalance != null && (
                      <p className={TEXT_SUB}>{t('afterBalance', { n: formatCreditsCount(tx.afterBalance) })}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
