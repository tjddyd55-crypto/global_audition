'use client'

import { Link } from '@/i18n.config'
import { formatCreditsCount } from '@/shared/money/creditsDisplay'

type ApplyCreditNoticeProps = {
  applyPolicySnapshot?: {
    active: boolean
    cost: number
    applicationPaymentMode?: string
    applicationFeeCredits?: number
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
  const mode =
    applyPolicySnapshot?.applicationPaymentMode ??
    (!applyPolicySnapshot || !applyPolicySnapshot.active || applyPolicySnapshot.cost <= 0 ? 'FREE' : 'CREDIT')
  const fee = applyPolicySnapshot?.applicationFeeCredits ?? applyPolicySnapshot?.cost ?? 0

  return (
    <>
      {applyPolicySnapshot && mode === 'FREE' ? (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          이번 지원은 무료입니다.
        </div>
      ) : null}

      {applyPolicySnapshot && mode === 'CREDIT' && fee > 0 && hasEnoughCredits ? (
        <div className="mb-4 rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-sm text-violet-900">
          지원 시 크레딧 {formatCreditsCount(fee)} 이 차감됩니다. 현재 보유 {formatCreditsCount(creditBalanceAmount)}
        </div>
      ) : null}

      {applyPolicySnapshot && mode === 'CREDIT' && fee > 0 && creditGateReady && !hasEnoughCredits ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          크레딧이 부족합니다. 필요 {formatCreditsCount(fee)} · 보유 {formatCreditsCount(creditBalanceAmount)} · 부족{' '}
          {formatCreditsCount(Math.max(0, fee - creditBalanceAmount))}
          <div className="mt-2">
            <Link href="/credits/charge" className="font-semibold text-violet-700 underline underline-offset-2">
              충전하기
            </Link>
          </div>
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
