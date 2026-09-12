'use client'

import { Link } from '@/i18n.config'
import { MultiRoundSubmitCta } from '@/components/application/MultiRoundSubmitCta'
import { useTranslations } from 'next-intl'

type PcAuditionDetailApplyBarProps = {
  auditionId: string
  isOpen: boolean
  alreadyApplied: boolean
  showApplySubmitCta: boolean
  showApplyLoginCta: boolean
  showApplyDisabledCta: boolean
  applyNavDisabledCombined: boolean
  applyNavBlockedBySeries: boolean
  applyBlockedMessage?: string | null
  applyPolicyLoading: boolean
  balanceLoading: boolean
  isMultiRoundAudition: boolean
  myApplicationIdForRound?: string | null
  myCurrentRoundUuid?: string | null
  myApplicantRoundNumber: number
  applyPolicySnapshot?: {
    active: boolean
    cost: number
    applicationPaymentMode?: string
    applicationFeeCredits?: number
  } | null
  creditBalanceAmount: number
  needCreditsForApply: boolean
  creditGateReady: boolean
  hasEnoughCredits: boolean
  applyPolicyError: boolean
}

const mainCtaClass =
  'flex w-full min-h-12 items-center justify-center rounded-lg bg-black py-4 text-center text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60'
const mainCtaFullWidthClass =
  'flex min-h-12 w-full items-center justify-center rounded-lg bg-black py-4 text-center text-lg font-semibold text-white'
const subCtaClass =
  'inline-flex min-h-12 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 py-3 text-center text-sm font-semibold text-neutral-900 sm:text-base'

export default function PcAuditionDetailApplyBar({
  auditionId,
  isOpen,
  alreadyApplied,
  showApplySubmitCta,
  showApplyLoginCta,
  showApplyDisabledCta,
  applyNavDisabledCombined,
  applyNavBlockedBySeries,
  applyBlockedMessage,
  applyPolicyLoading,
  balanceLoading,
  isMultiRoundAudition,
  myApplicationIdForRound,
  myCurrentRoundUuid,
  myApplicantRoundNumber,
  applyPolicySnapshot,
  creditBalanceAmount,
  needCreditsForApply,
  creditGateReady,
  hasEnoughCredits,
  applyPolicyError,
}: PcAuditionDetailApplyBarProps) {
  const tDetail = useTranslations('auditionDetail')
  const tApply = useTranslations('apply')
  const blockedFallback = applyBlockedMessage ?? tApply('prevRoundBlocked')
  return (
    <div
      id="audition-detail-apply"
      tabIndex={-1}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))] outline-none"
    >
      <div className="flex flex-col gap-2">
        {showApplySubmitCta && alreadyApplied ? (
          <button type="button" disabled className={mainCtaClass}>
            {tDetail('applyNow')}
          </button>
        ) : !isOpen ? (
          <button type="button" disabled className={mainCtaClass}>
            {tDetail('applyNow')}
          </button>
        ) : showApplySubmitCta ? (
          applyNavDisabledCombined ? (
            <button
              type="button"
              disabled
              title={
                applyNavBlockedBySeries
                  ? blockedFallback
                  : undefined
              }
              className={mainCtaClass}
            >
              {applyPolicyLoading || balanceLoading ? tDetail('checking') : tDetail('applyNow')}
            </button>
          ) : (
            <Link href={`/auditions/${auditionId}/apply`} className={`${mainCtaClass} no-underline`}>
              {tDetail('applyNow')}
            </Link>
          )
        ) : showApplyLoginCta ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/auditions/${auditionId}`)}`}
            className={`${mainCtaClass} no-underline`}
          >
            {tDetail('applyNow')}
          </Link>
        ) : showApplyDisabledCta ? (
          <button
            type="button"
            disabled
            title={tDetail('applicantOnly')}
            className={mainCtaClass}
          >
            {tDetail('applyNow')}
          </button>
        ) : (
          <button type="button" disabled className={mainCtaClass}>
            {tDetail('applyNow')}
          </button>
        )}

        {(showApplySubmitCta && alreadyApplied) || !isOpen ? (
          <div className="flex flex-wrap gap-2">
            {showApplySubmitCta && alreadyApplied ? (
              <Link href={`/auditions/${auditionId}/vote`} className={`${subCtaClass} no-underline`}>
                {tDetail('viewApplicantsVote')}
              </Link>
            ) : null}
            {!isOpen ? (
              <Link href={`/auditions/${auditionId}/ranking`} className={`${subCtaClass} no-underline`}>
                {tDetail('viewRanking')}
              </Link>
            ) : null}
          </div>
        ) : null}

        {showApplySubmitCta && alreadyApplied ? (
          <p className="mt-2 text-center text-xs text-neutral-500">{tDetail('alreadyAppliedHere')}</p>
        ) : null}

        {showApplySubmitCta && alreadyApplied && isMultiRoundAudition && myApplicationIdForRound ? (
          myCurrentRoundUuid ? (
            <div className="mt-2">
              <MultiRoundSubmitCta
                applicationId={myApplicationIdForRound}
                auditionId={auditionId}
                roundId={myCurrentRoundUuid}
                label={tApply('roundApplyCta', { n: myApplicantRoundNumber })}
                className={`${mainCtaFullWidthClass} no-underline`}
              />
            </div>
          ) : (
            <p className="mt-2 text-center text-xs text-amber-700">
              {tDetail('roundInfoFailed')}
            </p>
          )
        ) : null}

        {isOpen && showApplySubmitCta && !alreadyApplied ? (
          <div className="mt-2 space-y-1 text-xs">
            {applyNavBlockedBySeries ? (
              <p className="text-center text-amber-800">{blockedFallback}</p>
            ) : null}
            {applyPolicySnapshot &&
            (applyPolicySnapshot.applicationPaymentMode ??
              (applyPolicySnapshot.active && applyPolicySnapshot.cost > 0 ? 'CREDIT' : 'FREE')) === 'FREE' ? (
              <p className="text-center text-neutral-500">{tDetail('applyFree')}</p>
            ) : null}
            {needCreditsForApply && hasEnoughCredits ? (
              <p className="text-center text-neutral-500">
                {tDetail('creditCostHold', {
                  fee: applyPolicySnapshot?.applicationFeeCredits ?? applyPolicySnapshot?.cost,
                  balance: creditBalanceAmount,
                })}
              </p>
            ) : null}
            {needCreditsForApply && creditGateReady && !hasEnoughCredits ? (
              <Link
                href="/credits/charge"
                className="flex min-h-10 items-center justify-center rounded-lg border-2 border-violet-600 bg-white text-sm font-semibold text-violet-700 no-underline hover:bg-violet-50"
              >
                {tApply('charge')}
              </Link>
            ) : null}
            {applyPolicyError ? (
              <p className="text-center text-red-600">{tApply('policyLoadFailed')}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
