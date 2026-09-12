'use client'

import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n.config'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { applicationApi } from '@/shared/api/applications'
import { AuditionApplyForm } from '@/components/application/AuditionApplyForm'
import { auditionHeadlineTitle, PREV_ROUND_APPLY_BLOCKED_MSG } from '@/shared/types/audition'
import { useAuditionApplyPageState } from '@/shared/audition/useAuditionApplyPageState'
import { useAuditionApplySubmitGate } from '@/shared/audition/useAuditionApplySubmitGate'
import ApplyPageShell from '@/components/application/ApplyPageShell'
import ApplyPageGuardState from '@/components/application/ApplyPageGuardState'
import ApplyPageHeader from '@/components/application/ApplyPageHeader'
import ApplyCreditNotice from '@/components/application/ApplyCreditNotice'

export default function MobileAuditionApplyPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const t = useTranslations('common')
  const tApply = useTranslations('apply')
  const tDetail = useTranslations('auditionDetail')
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
        message={tApply('notRecruiting')}
        href={`/auditions/${auditionId}`}
        linkLabel={tApply('backToDetailShort')}
        messageClassName="mb-4 text-red-600"
      />
    )
  }

  if (!token) {
    return (
      <ApplyPageGuardState
        message={tDetail('loginToApply')}
        href="/login"
        linkLabel={t('login')}
        messageClassName="mb-4"
      />
    )
  }

  if (role !== 'APPLICANT' && role !== 'ADMIN') {
    return (
      <ApplyPageGuardState
        message={tApply('applicantAccountOnly')}
        href={`/auditions/${auditionId}`}
        linkLabel={tApply('backToDetailShort')}
        messageClassName="mb-4 text-neutral-600"
      />
    )
  }

  if (audition.hasApplied === true) {
    return (
      <ApplyPageGuardState
        message={tApply('alreadyAppliedHere')}
        href={`/auditions/${auditionId}`}
        linkLabel={tApply('backToDetail')}
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
        linkLabel={tApply('backToDetailShort')}
        messageClassName="mb-2 max-w-md text-neutral-800"
        className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 p-4 text-center"
      />
    )
  }

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
        errorMessage={undefined}
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
              throw new Error(serverMsg || tApply('alreadyDone'))
            }
            if (ax.response?.status === 403) {
              throw new Error(serverMsg || PREV_ROUND_APPLY_BLOCKED_MSG)
            }
            throw new Error(serverMsg || (err instanceof Error ? err.message : tApply('failed')))
          }
          queryClient.invalidateQueries({ queryKey: ['audition', auditionId] })
          queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] })
          router.push('/my/applications')
        }}
      />
    </ApplyPageShell>
  )
}
