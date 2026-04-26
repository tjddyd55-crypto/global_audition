'use client'

import { useQuery } from '@tanstack/react-query'
import { CREDIT_POLICY_AUDITION_APPLY, creditsApi } from '@/shared/api/credits'

type UseAuditionApplyCreditGateParams = {
  auditionId: string
  isOpen: boolean
  showApplySubmitCta: boolean
  alreadyApplied: boolean
}

export function useAuditionApplyCreditGate({
  auditionId,
  isOpen,
  showApplySubmitCta,
  alreadyApplied,
}: UseAuditionApplyCreditGateParams) {
  const { data: applyPolicySnapshot, isLoading: applyPolicyLoading, isError: applyPolicyError } = useQuery({
    queryKey: ['credit-policy-public', CREDIT_POLICY_AUDITION_APPLY],
    queryFn: () => creditsApi.getPublicPolicy(CREDIT_POLICY_AUDITION_APPLY),
    enabled: !!auditionId && isOpen,
    staleTime: 60_000,
  })

  const { data: creditBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: () => creditsApi.getBalance(),
    enabled: !!auditionId && showApplySubmitCta,
    staleTime: 30_000,
  })

  const creditBalanceAmount = creditBalance?.balance ?? 0
  const needCreditsForApply =
    !!applyPolicySnapshot && applyPolicySnapshot.active && applyPolicySnapshot.cost > 0
  const creditGateReady = !needCreditsForApply || !balanceLoading
  const hasEnoughCredits =
    !applyPolicySnapshot || !applyPolicySnapshot.active || applyPolicySnapshot.cost <= 0
      ? true
      : creditBalanceAmount >= applyPolicySnapshot.cost
  const applyNavDisabledForCredits = Boolean(
    showApplySubmitCta &&
      !alreadyApplied &&
      (applyPolicyLoading ||
        applyPolicyError ||
        !applyPolicySnapshot ||
        !applyPolicySnapshot.active ||
        !creditGateReady ||
        !hasEnoughCredits)
  )

  return {
    applyPolicySnapshot,
    applyPolicyLoading,
    applyPolicyError,
    balanceLoading,
    creditBalanceAmount,
    needCreditsForApply,
    creditGateReady,
    hasEnoughCredits,
    applyNavDisabledForCredits,
  }
}
