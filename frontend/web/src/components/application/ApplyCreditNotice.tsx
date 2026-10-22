'use client'

import { Link } from '@/i18n.config'
import { formatCreditsCount } from '@/shared/money/creditsDisplay'
import { formatUsdAmount } from '@/shared/money/currency'
import { useLocale } from 'next-intl'
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
  const locale = useLocale()
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
            usd: formatUsdAmount(usd, locale),
            credits: formatCreditsCount(credits, locale),
            balance: formatCreditsCount(creditBalanceAmount, locale),
          })}
        </div>
      ) : null}

      {applyPolicySnapshot && mode === 'CREDIT' && credits > 0 && creditGateReady && !hasEnoughCredits ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('insufficientDetail', {
            usd: formatUsdAmount(usd, locale),
            required: formatCreditsCount(credits, locale),
            current: formatCreditsCount(creditBalanceAmount, locale),
            shortfall: formatCreditsCount(Math.max(0, credits - creditBalanceAmount), locale),
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
