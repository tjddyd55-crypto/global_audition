'use client'

import { useQuery } from '@tanstack/react-query'
import { CREDIT_POLICY_AUDITION_APPLY, creditsApi } from '@/shared/api/credits'

type UseAuditionApplySubmitGateParams = {
  enabled: boolean
}

export function useAuditionApplySubmitGate({ enabled }: UseAuditionApplySubmitGateParams) {
  const { data: applyPolicySnapshot, isLoading: applyPolicyLoading, isError: applyPolicyError } = useQuery({
    queryKey: ['credit-policy-public', CREDIT_POLICY_AUDITION_APPLY],
    queryFn: () => creditsApi.getPublicPolicy(CREDIT_POLICY_AUDITION_APPLY),
    enabled,
    staleTime: 60_000,
  })

  const { data: creditBalance, isLoading: balanceLoading } = useQuery({
    queryKey: ['credits', 'balance'],
    queryFn: () => creditsApi.getBalance(),
    enabled,
    staleTime: 30_000,
  })

  const creditBalanceAmount = creditBalance?.balance ?? 0
  const applicationPaymentMode =
    applyPolicySnapshot?.applicationPaymentMode ??
    (!applyPolicySnapshot || !applyPolicySnapshot.active || applyPolicySnapshot.cost <= 0 ? 'FREE' : 'CREDIT')
  const applicationFeeCredits = applyPolicySnapshot?.applicationFeeCredits ?? applyPolicySnapshot?.cost ?? 0
  const needCreditsForApply = applicationPaymentMode === 'CREDIT' && applicationFeeCredits > 0
  const creditGateReady = !needCreditsForApply || !balanceLoading
  const hasEnoughCredits = !needCreditsForApply || creditBalanceAmount >= applicationFeeCredits
  const submitDisabled =
    applyPolicyLoading || applyPolicyError || !applyPolicySnapshot || !creditGateReady || !hasEnoughCredits

  return {
    applyPolicySnapshot,
    applyPolicyLoading,
    applyPolicyError,
    balanceLoading,
    creditBalanceAmount,
    needCreditsForApply,
    creditGateReady,
    hasEnoughCredits,
    submitDisabled,
  }
}
