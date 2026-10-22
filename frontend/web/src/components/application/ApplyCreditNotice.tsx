'use client'

import { Link } from '@/i18n.config'
import { formatCreditsCount } from '@/shared/money/creditsDisplay'
import { resolveApplicationFeeCredits, resolveApplicationFeeUsd } from '@/shared/api/credits'
import { useTranslations } from 'next-intl'

type ApplyCreditNoticeProps = {
  applyPolicySnapshot?: {
    active: boolean
    cost: number
    applicationPaymentMode?: string
    applicationFeeCredits?: number
    applicationFeeUsd?: number
  } | null
  applyPolicyError: boolean
  creditBalanceAmount: number
  creditGateReady: boolean
  hasEnoughCredits: boolean
  errorMessage?: string
}

export default function ApplyCreditNotice({
  applyPolicySnapshot,
  applyPolicyError,
  creditBalanceAmount,
  creditGateReady,
  hasEnoughCredits,
  errorMessage,
}: ApplyCreditNoticeProps) {
  const t = useTranslations('apply')
  const tCredits = useTranslations('credits')
  const mode =
    applyPolicySnapshot?.applicationPaymentMode ??
    (!applyPolicySnapshot || !applyPolicySnapshot.active || applyPolicySnapshot.cost <= 0 ? 'FREE' : 'CREDIT')
  const usd = resolveApplicationFeeUsd(applyPolicySnapshot)
  const credits = resolveApplicationFeeCredits(applyPolicySnapshot)

  return (
    <>
      {applyPolicySnapshot && mode === 'FREE' ? (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {t('freeApply')}
        </div>
      ) : null}

      {applyPolicySnapshot && mode === 'CREDIT' && credits > 0 && hasEnoughCredits ? (
        <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          {t('creditMeta', {
            usd: formatCreditsCount(usd),
            credits: formatCreditsCount(credits),
            balance: formatCreditsCount(creditBalanceAmount),
          })}
        </div>
      ) : null}

      {applyPolicySnapshot && mode === 'CREDIT' && credits > 0 && creditGateReady && !hasEnoughCredits ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('insufficientDetail', {
            usd: formatCreditsCount(usd),
            required: formatCreditsCount(credits),
            current: formatCreditsCount(creditBalanceAmount),
            shortfall: formatCreditsCount(Math.max(0, credits - creditBalanceAmount)),
          })}
          <div className="mt-2">
            <Link href="/credits/charge" className="font-semibold text-violet-700 underline underline-offset-2">
              {t('charge')}
            </Link>
          </div>
        </div>
      ) : null}

      {applyPolicyError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage ?? tCredits('policyLoadFailed')}
        </div>
      ) : null}
    </>
  )
}
