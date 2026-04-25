'use client'

import { Link } from '@/i18n.config'
import { MultiRoundSubmitCta } from '@/components/application/MultiRoundSubmitCta'
import { PREV_ROUND_APPLY_BLOCKED_MSG } from '@/shared/types/audition'

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
  return (
    <div
      id="audition-detail-apply"
      tabIndex={-1}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-neutral-200 bg-white p-3 pb-[max(12px,env(safe-area-inset-bottom))] outline-none"
    >
      <div className="flex flex-col gap-2">
        {showApplySubmitCta && alreadyApplied ? (
          <button type="button" disabled className={mainCtaClass}>
            지금 지원하기
          </button>
        ) : !isOpen ? (
          <button type="button" disabled className={mainCtaClass}>
            지금 지원하기
          </button>
        ) : showApplySubmitCta ? (
          applyNavDisabledCombined ? (
            <button
              type="button"
              disabled
              title={
                applyNavBlockedBySeries
                  ? (applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG)
                  : undefined
              }
              className={mainCtaClass}
            >
              {applyPolicyLoading || balanceLoading ? '확인 중...' : '지금 지원하기'}
            </button>
          ) : (
            <Link href={`/auditions/${auditionId}/apply`} className={`${mainCtaClass} no-underline`}>
              지금 지원하기
            </Link>
          )
        ) : showApplyLoginCta ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/auditions/${auditionId}`)}`}
            className={`${mainCtaClass} no-underline`}
          >
            지금 지원하기
          </Link>
        ) : showApplyDisabledCta ? (
          <button
            type="button"
            disabled
            title="지원자 계정으로 로그인 후 이용할 수 있습니다."
            className={mainCtaClass}
          >
            지금 지원하기
          </button>
        ) : (
          <button type="button" disabled className={mainCtaClass}>
            지금 지원하기
          </button>
        )}

        {(showApplySubmitCta && alreadyApplied) || !isOpen ? (
          <div className="flex flex-wrap gap-2">
            {showApplySubmitCta && alreadyApplied ? (
              <Link href={`/auditions/${auditionId}/vote`} className={`${subCtaClass} no-underline`}>
                지원자 보기 &amp; 투표
              </Link>
            ) : null}
            {!isOpen ? (
              <Link href={`/auditions/${auditionId}/ranking`} className={`${subCtaClass} no-underline`}>
                랭킹 보기
              </Link>
            ) : null}
          </div>
        ) : null}

        {showApplySubmitCta && alreadyApplied ? (
          <p className="mt-2 text-center text-xs text-neutral-500">이 오디션에 이미 지원하셨습니다.</p>
        ) : null}

        {showApplySubmitCta && alreadyApplied && isMultiRoundAudition && myApplicationIdForRound ? (
          myCurrentRoundUuid ? (
            <div className="mt-2">
              <MultiRoundSubmitCta
                applicationId={myApplicationIdForRound}
                auditionId={auditionId}
                roundId={myCurrentRoundUuid}
                label={`${myApplicantRoundNumber}차 지원하기`}
                className={`${mainCtaFullWidthClass} no-underline`}
              />
            </div>
          ) : (
            <p className="mt-2 text-center text-xs text-amber-700">
              라운드 정보를 불러오지 못했습니다. 내 지원서 상세에서 다시 시도해 주세요.
            </p>
          )
        ) : null}

        {isOpen && showApplySubmitCta && !alreadyApplied ? (
          <div className="mt-2 space-y-1 text-xs">
            {applyNavBlockedBySeries ? (
              <p className="text-center text-amber-800">{applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG}</p>
            ) : null}
            {applyPolicySnapshot && applyPolicySnapshot.active && applyPolicySnapshot.cost > 0 ? (
              <p className="text-center text-neutral-500">
                지원 시 크레딧 {applyPolicySnapshot.cost} 소모 · 보유 {creditBalanceAmount}
              </p>
            ) : null}
            {needCreditsForApply && creditGateReady && !hasEnoughCredits && applyPolicySnapshot?.active ? (
              <Link
                href="/credits/charge"
                className="flex min-h-10 items-center justify-center rounded-lg border-2 border-violet-600 bg-white text-sm font-semibold text-violet-700 no-underline hover:bg-violet-50"
              >
                크레딧 충전하기
              </Link>
            ) : null}
            {applyPolicySnapshot && !applyPolicySnapshot.active ? (
              <p className="text-center text-amber-700">지원 비용 정책이 비활성화되어 지원할 수 없습니다.</p>
            ) : null}
            {applyPolicyError ? (
              <p className="text-center text-red-600">지원 비용 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
