'use client'

import { useParams } from 'next/navigation'
import { useRouter, Link } from '../../../../../i18n.config'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { auditionApi } from '@/lib/api/auditions'
import { applicationApi } from '@/lib/api/applications'
import { authApi } from '@/lib/api/auth'
import { useTranslations } from 'next-intl'
import { AuditionApplyForm } from '@/components/application/AuditionApplyForm'
import { meProfileApi } from '@/lib/api/meProfile'
import { CREDIT_POLICY_AUDITION_APPLY, creditsApi } from '@/lib/api/credits'
import { useAuthStore } from '@/lib/auth/authStore'
import { auditionHeadlineTitle, PREV_ROUND_APPLY_BLOCKED_MSG } from '@/lib/types/audition'
import { formatCreditsCount } from '@/lib/money/creditsDisplay'

export default function ApplyPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('common')
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
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (audition.status !== 'OPEN') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <p className="mb-4 text-red-600">이 오디션은 현재 모집 중이 아닙니다.</p>
        <Link href={`/auditions/${auditionId}`} className="text-violet-600 hover:underline">
          오디션 상세로 돌아가기
        </Link>
      </div>
    )
  }

  if (!authApi.getToken()) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <p className="mb-4">지원하려면 로그인해 주세요.</p>
        <Link href="/login" className="text-violet-600 hover:underline">
          로그인
        </Link>
      </div>
    )
  }

  if (role !== 'APPLICANT' && role !== 'ADMIN') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <p className="mb-4 text-neutral-600">지원자 계정으로 로그인 후 이용할 수 있습니다.</p>
        <Link href={`/auditions/${auditionId}`} className="text-violet-600 hover:underline">
          오디션 상세로
        </Link>
      </div>
    )
  }

  const seriesRound = audition.round ?? 1
  const blockedByPrevRound =
    seriesRound >= 2 && audition.canApply === false
  if (blockedByPrevRound) {
    const msg = audition.applyBlockedMessage ?? PREV_ROUND_APPLY_BLOCKED_MSG
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center">
        <p className="mb-2 max-w-md text-neutral-800">{msg}</p>
        <Link href={`/auditions/${auditionId}`} className="text-violet-600 hover:underline">
          오디션 상세로 돌아가기
        </Link>
      </div>
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
    <div className="min-h-screen bg-neutral-50 px-4 py-6 pb-24 md:px-8 md:py-10">
      <div className="mx-auto max-w-lg">
        <div className="mb-6">
          <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 hover:underline">
            ← 오디션 상세
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-neutral-900">{auditionHeadlineTitle(audition)}</h1>
          <p className="mt-1 text-sm text-neutral-500">지원서는 한 번에 제출되며, 제출 후 수정은 불가할 수 있습니다.</p>
        </div>

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
            지원 비용 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.
          </div>
        ) : null}

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
      </div>
    </div>
  )
}
