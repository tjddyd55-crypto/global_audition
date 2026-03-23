'use client'

import { useEffect, useState } from 'react'
import { useRouter, Link } from '../../../i18n.config'
import { authApi } from '@/lib/api/auth'
import { creditsApi, type CreditTransactionItem } from '@/lib/api/credits'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'

function formatAmount(amount: number) {
  return amount > 0 ? `+${amount.toLocaleString('ko-KR')}` : amount.toLocaleString('ko-KR')
}

function typeLabel(type: string) {
  if (type === 'CHARGE') return '충전'
  if (type === 'USE') return '사용'
  if (type === 'GRANT') return '지급'
  return type
}

function reasonSummary(type: string, reason: string, referenceId: string | null) {
  if (type === 'USE' && reason === 'AUDITION_APPLY' && referenceId) {
    return `오디션 지원 (참조: ${referenceId.slice(0, 8)}…)`
  }
  if (type === 'CHARGE' && reason === 'PACKAGE_PURCHASE') {
    return '패키지 결제 충전'
  }
  return reason
}

const TX_TYPE_FILTERS = [
  { value: '', label: '전체' },
  { value: 'CHARGE', label: '충전' },
  { value: 'USE', label: '사용' },
  { value: 'GRANT', label: '지급' },
] as const

export default function CreditsDashboardPage() {
  const router = useRouter()
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<CreditTransactionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('')

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
          setError('크레딧 정보를 불러오지 못했습니다. 다시 시도해 주세요.')
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
  }, [router, typeFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className={TITLE_PAGE}>크레딧</h1>
          <Link href="/my/dashboard" className={`${BTN_SECONDARY} text-center text-sm`}>
            대시보드로
          </Link>
        </div>

        <div className={CARD_BASE}>
          <p className={`${TEXT_SUB} mb-2`}>현재 크레딧</p>
          {isLoading ? (
            <p className="text-2xl font-semibold text-gray-400">불러오는 중…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <p className="text-4xl font-bold tracking-tight text-[#3B82F6]">
              {(balance ?? 0).toLocaleString('ko-KR')}
              <span className="ml-2 text-lg font-semibold text-gray-600">C</span>
            </p>
          )}
          <div className="mt-6">
            <Link href="/credits/charge" className={BTN_PRIMARY}>
              충전하기
            </Link>
          </div>
        </div>

        <div className={CARD_BASE}>
          <h2 className={`${TITLE_PAGE} mb-1`}>크레딧 사용 내역</h2>
          <p className={`${TEXT_SUB} mb-3`}>충전·사용·지급을 구분해 조회합니다. (최근 50건)</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {TX_TYPE_FILTERS.map((f) => (
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
            <p className={TEXT_SUB}>불러오는 중…</p>
          ) : transactions.length === 0 ? (
            <p className={TEXT_SUB}>거래 내역이 없습니다.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-[#E5E7EB]">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {typeLabel(tx.type)} · {reasonSummary(tx.type, tx.reason, tx.referenceId ?? null)}
                    </p>
                    <p className={TEXT_SUB}>
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString('ko-KR') : '-'}
                      {tx.referenceId ? (
                        <span className="mt-0.5 block font-mono text-[11px] text-gray-400">
                          ref: {tx.referenceId}
                        </span>
                      ) : null}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatAmount(tx.amount)}
                    </p>
                    {tx.afterBalance != null && (
                      <p className={TEXT_SUB}>잔액 {tx.afterBalance.toLocaleString('ko-KR')}</p>
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
