'use client'

import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n.config'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { auditionApi } from '@/shared/api/auditions'
import { applicationApi } from '@/shared/api/applications'
import { authApi } from '@/shared/api/auth'
import { AuditionApplyForm } from '@/components/application/AuditionApplyForm'
import { meProfileApi } from '@/shared/api/meProfile'
import { CREDIT_POLICY_AUDITION_APPLY, creditsApi } from '@/shared/api/credits'
import { useAuthStore } from '@/shared/auth/authStore'
import { auditionHeadlineTitle, PREV_ROUND_APPLY_BLOCKED_MSG } from '@/shared/types/audition'
import ApplyPageShell from '@/components/application/ApplyPageShell'
import ApplyPageGuardState from '@/components/application/ApplyPageGuardState'
import ApplyPageHeader from '@/components/application/ApplyPageHeader'
import ApplyCreditNotice from '@/components/application/ApplyCreditNotice'

export default function MobileAuditionApplyPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const auditionId = params.id as string
  const role = useAuthStore((s) => s.role)

  const { data: audition, isLoading } = useQuery({
    queryKey: ['audition', auditionId],
    queryFn: () => auditionApi.getById(auditionId),
    enabled: !!auditionId,
  })

  const isOpenAudition = audition?.status === 'OPEN'
  const showCreditQueries =
    !!auditionId && isOpenAudition && !!authApi.getToken() && (role === 'APPLICANT' || role === 'ADMIN')

  const { data: meProfile, isFetched: meProfileFetched } = useQuery({
    queryKey: ['me-profile', 'apply-prefill'],
    queryFn: () => meProfileApi.get(),
    enabled: showCreditQueries,
    staleTime: 60_000,
  })

  const { data: applyPolicy, isLoading: applyPolicyLoading, isError: applyPolicyError } = useQuery({
    queryKey: ['credit-policy-public', CREDIT_POLICY_AUDITION_APPLY],
    queryFn: () => creditsApi.getPublicPolicy(CREDIT_POLICY_AUDITION_APPLY),
    enabled: showCreditQueries,
    staleTime: 60_000,
  })

  const { data: creditBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: () => creditsApi.getBalance(),
    enabled: showCreditQueries,
    staleTime: 30_000,
  })

  if (isLoading || !audition) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  if (audition.status !== 'OPEN') {
    return (
      <ApplyPageGuardState
        message="이 오디션은 현재 모집 중이 아닙니다."
        href={`/auditions/${auditionId}`}
        linkLabel="오디션 상세로"
        messageClassName="mb-4 text-red-600"
      />
    )
  }

  if (!authApi.getToken()) {
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
  if (seriesRound >= 2 && audition.canApply === false) {
    const msg = audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG
    return (
      <ApplyPageGuardState
        message={msg}
        href={`/auditions/${auditionId}`}
        linkLabel="오디션 상세로"
        messageClassName="mb-2 max-w-md text-neutral-800"
        className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center"
      />
    )
  }

  const applyPolicySnapshot = applyPolicy
  const creditBalanceAmount = creditBalance?.balance ?? 0
  const needCreditsForApply =
    !!applyPolicySnapshot && applyPolicySnapshot.active && applyPolicySnapshot.cost > 0
  const creditGateReady = !needCreditsForApply || !balanceLoading
  const hasEnoughCredits =
    !applyPolicySnapshot || !applyPolicySnapshot.active || applyPolicySnapshot.cost <= 0
      ? true
      : creditBalanceAmount >= applyPolicySnapshot.cost
  const submitDisabled =
    applyPolicyLoading ||
    applyPolicyError ||
    !applyPolicySnapshot ||
    !applyPolicySnapshot.active ||
    !creditGateReady ||
    !hasEnoughCredits

  return (
    <ApplyPageShell className="min-h-screen bg-neutral-50 px-4 py-6 pb-24">
      <ApplyPageHeader
        auditionId={auditionId}
        title={auditionHeadlineTitle(audition)}
      />

      <ApplyCreditNotice
        applyPolicySnapshot={applyPolicySnapshot}
        applyPolicyError={applyPolicyError}
        creditBalanceAmount={creditBalanceAmount}
        creditGateReady={creditGateReady}
        hasEnoughCredits={hasEnoughCredits}
        errorMessage="지원 비용 정보를 불러오지 못했습니다."
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
