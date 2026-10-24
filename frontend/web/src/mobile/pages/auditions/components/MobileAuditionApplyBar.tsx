'use client'

import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import type { AuditionDto } from '@/shared/types/audition'
import { applyBlockedDisplayMessage } from '@/shared/audition/applyBlockedCopy'
import { useAuditionApplyCreditGate } from '@/shared/audition/useAuditionApplyCreditGate'
import { resolveApplicationFeeCredits, resolveApplicationFeeUsd } from '@/shared/api/credits'
import { formatCreditsCount } from '@/shared/money/creditsDisplay'
import { formatUsdAmount } from '@/shared/money/currency'
import { useAuthStore } from '@/shared/auth/authStore'

type MobileAuditionApplyBarProps = {
  audition: AuditionDto
  auditionId: string
  alreadyApplied: boolean
  applyBlocked: boolean
}

export default function MobileAuditionApplyBar({
  audition,
  auditionId,
  alreadyApplied,
  applyBlocked,
}: MobileAuditionApplyBarProps) {
  const tDetail = useTranslations('auditionDetail')
  const tApply = useTranslations('apply')
  const locale = useLocale()
  const role = useAuthStore((s) => s.role)
  const accessToken = useAuthStore((s) => s.accessToken)
  const isOpen = audition.status === 'OPEN'
  const showBalance = Boolean(accessToken) && role === 'APPLICANT' && isOpen && !alreadyApplied
  const gate = useAuditionApplyCreditGate({
    auditionId,
    isOpen,
    showApplySubmitCta: showBalance,
    alreadyApplied,
  })
  const usd = formatUsdAmount(resolveApplicationFeeUsd(gate.applyPolicySnapshot), locale)
  const credits = formatCreditsCount(resolveApplicationFeeCredits(gate.applyPolicySnapshot), locale)
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))]">
      {alreadyApplied ? (
        <button
          type="button"
          disabled
          className="w-full rounded-xl bg-black py-3.5 text-base font-semibold text-white opacity-60"
          title={tDetail('alreadyAppliedHere')}
        >
          {tDetail('alreadyAppliedShort')}
        </button>
      ) : applyBlocked ? (
        <button
          type="button"
          disabled
          className="w-full rounded-xl bg-black py-3.5 text-base font-semibold text-white opacity-60"
          title={applyBlockedDisplayMessage(
            audition.applyBlockedCode,
            tApply('prevRoundBlocked'),
            tApply('failed'),
          )}
        >
          {tDetail('applyNow')}
        </button>
      ) : (
        <Link
          href={`/auditions/${auditionId}/apply`}
          className="flex w-full items-center justify-center rounded-xl bg-black py-3.5 text-base font-semibold text-white no-underline"
        >
          {tDetail('applyNow')}
        </Link>
      )}
      {isOpen && !alreadyApplied && gate.applyPolicySnapshot ? (
        <p className="mt-2 text-center text-xs text-neutral-600">
          {(gate.applyPolicySnapshot.applicationPaymentMode ??
            (gate.applyPolicySnapshot.active && gate.applyPolicySnapshot.cost > 0 ? 'CREDIT' : 'FREE')) === 'FREE'
            ? tDetail('applyFree')
            : showBalance && gate.creditGateReady && !gate.hasEnoughCredits
              ? tApply('insufficientDetail', {
                  usd,
                  required: credits,
                  current: formatCreditsCount(gate.creditBalanceAmount, locale),
                  shortfall: formatCreditsCount(
                    Math.max(0, resolveApplicationFeeCredits(gate.applyPolicySnapshot) - gate.creditBalanceAmount),
                    locale,
                  ),
                })
              : showBalance && gate.hasEnoughCredits
                ? tDetail('creditCostHold', {
                    usd,
                    credits,
                    balance: formatCreditsCount(gate.creditBalanceAmount, locale),
                  })
                : tDetail('applicationFee', { usd, credits })}
        </p>
      ) : null}
    </div>
  )
}
