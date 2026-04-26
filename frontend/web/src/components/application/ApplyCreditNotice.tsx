'use client'

import { Link } from '@/i18n.config'
import { formatCreditsCount } from '@/shared/money/creditsDisplay'

type ApplyCreditNoticeProps = {
  applyPolicySnapshot?: {
    active: boolean
    cost: number
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
  errorMessage = '지원 비용 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
}: ApplyCreditNoticeProps) {
  return (
    <>
      {applyPolicySnapshot && applyPolicySnapshot.active && applyPolicySnapshot.cost > 0 ? (
        <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          지원 시 크레딧 {formatCreditsCount(applyPolicySnapshot.cost)} 소모 · 현재 보유{' '}
          {formatCreditsCount(creditBalanceAmount)}
          {creditGateReady && !hasEnoughCredits ? (
            <div className="mt-2">
              <Link
                href="/credits/charge"
                className="font-semibold text-violet-700 underline underline-offset-2"
              >
                크레딧 충전하기
              </Link>
            </div>
          ) : null}
        </div>
      ) : null}

      {applyPolicySnapshot && !applyPolicySnapshot.active ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          지원 비용 정책이 비활성화되어 지원할 수 없습니다.
        </div>
      ) : null}

      {applyPolicyError ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </>
  )
}
