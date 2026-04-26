'use client'

import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n.config'
import { useQueryClient } from '@tanstack/react-query'
import { applicationApi } from '@/shared/api/applications'
import { useTranslations } from 'next-intl'
import { AuditionApplyForm } from '@/components/application/AuditionApplyForm'
import { auditionHeadlineTitle, PREV_ROUND_APPLY_BLOCKED_MSG } from '@/shared/types/audition'
import { useAuditionApplyPageState } from '@/shared/audition/useAuditionApplyPageState'
import { useAuditionApplySubmitGate } from '@/shared/audition/useAuditionApplySubmitGate'
import ApplyPageShell from '@/components/application/ApplyPageShell'
import ApplyPageGuardState from '@/components/application/ApplyPageGuardState'
import ApplyPageHeader from '@/components/application/ApplyPageHeader'
import ApplyCreditNotice from '@/components/application/ApplyCreditNotice'

export default function PcAuditionApplyPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('common')
  const auditionId = params.id as string

  const {
    audition,
    isLoading,
    role,
    token,
    showCreditQueries,
    meProfile,
    meProfileFetched,
  } = useAuditionApplyPageState(auditionId)

  const {
    applyPolicySnapshot,
    applyPolicyError,
    creditBalanceAmount,
    creditGateReady,
    hasEnoughCredits,
    submitDisabled,
  } = useAuditionApplySubmitGate({ enabled: showCreditQueries })

  if (isLoading || !audition) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (audition.status !== 'OPEN') {
    return (
      <ApplyPageGuardState
        message="이 오디션은 현재 모집 중이 아닙니다."
        href={`/auditions/${auditionId}`}
        linkLabel="오디션 상세로 돌아가기"
        messageClassName="mb-4 text-red-600"
      />
    )
  }

  if (!token) {
    return (
      <ApplyPageGuardState
        message="지원하려면 로그인해 주세요."
        href="/login"
        linkLabel="로그인"
        messageClassName="mb-4"
      />
    )
  }

  if (role !== 'APPLICANT' && role !== 'ADMIN') {
    return (
      <ApplyPageGuardState
        message="지원자 계정으로 로그인 후 이용할 수 있습니다."
        href={`/auditions/${auditionId}`}
        linkLabel="오디션 상세로"
        messageClassName="mb-4 text-neutral-600"
      />
    )
  }

  if (audition.hasApplied === true) {
    return (
      <ApplyPageGuardState
        message="이 오디션에 이미 지원하셨습니다."
        href={`/auditions/${auditionId}`}
        linkLabel="오디션 상세로 돌아가기"
        messageClassName="mb-4 text-neutral-800"
      />
    )
  }

  const seriesRound = audition.round ?? 1
  const blockedByPrevRound =
    seriesRound >= 2 && audition.canApply === false
  if (blockedByPrevRound) {
    const msg = audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG
    return (
      <ApplyPageGuardState
        message={msg}
        href={`/auditions/${auditionId}`}
        linkLabel="오디션 상세로 돌아가기"
        messageClassName="mb-2 max-w-md text-neutral-800"
        className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center"
      />
    )
  }

  return (
    <ApplyPageShell>
      <ApplyPageHeader
        auditionId={auditionId}
        title={auditionHeadlineTitle(audition)}
        description="지원서는 한 번에 제출되며, 제출 후 수정은 불가할 수 있습니다."
      />

      <ApplyCreditNotice
        applyPolicySnapshot={applyPolicySnapshot}
        applyPolicyError={applyPolicyError}
        creditBalanceAmount={creditBalanceAmount}
        creditGateReady={creditGateReady}
        hasEnoughCredits={hasEnoughCredits}
      />

      <AuditionApplyForm
        auditionId={auditionId}
        disabled={submitDisabled}
        meProfile={meProfile}
        meProfileReady={showCreditQueries && meProfileFetched}
        onSubmit={async (payload) => {
          try {
            await applicationApi.submit(payload)
          } catch (err: unknown) {
            const ax = err as { response?: { status?: number; data?: { message?: string } } }
            const serverMsg = ax.response?.data?.message
            if (ax.response?.status === 409) {
              throw new Error(serverMsg || '이미 지원 완료입니다.')
            }
            if (ax.response?.status === 403) {
              throw new Error(serverMsg || PREV_ROUND_APPLY_BLOCKED_MSG)
            }
            throw new Error(serverMsg || (err instanceof Error ? err.message : '지원에 실패했습니다.'))
          }
          queryClient.invalidateQueries({ queryKey: ['audition', auditionId] })
          queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] })
          router.push('/my/applications')
        }}
      />
    </ApplyPageShell>
  )
}
