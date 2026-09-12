import { useQuery } from '@tanstack/react-query'
import { CREDIT_POLICY_AUDITION_APPLY, creditApi } from '../api/endpoints'
import { queryKeys } from '../api/queryKeys'

export function useApplyCreditDisplay(enabled: boolean) {
  const policyQuery = useQuery({
    queryKey: queryKeys.creditPolicy(CREDIT_POLICY_AUDITION_APPLY),
    queryFn: () => creditApi.getPublicPolicy(CREDIT_POLICY_AUDITION_APPLY),
    enabled,
  })
  const balanceQuery = useQuery({
    queryKey: queryKeys.creditBalance,
    queryFn: creditApi.getBalance,
    enabled,
  })

  const policy = policyQuery.data
  const balance = balanceQuery.data?.balance ?? 0
  const fee = policy?.active ? policy.cost : 0

  return {
    fee,
    balance,
    active: policy?.active ?? true,
    loading: policyQuery.isLoading || balanceQuery.isLoading,
    error: policyQuery.isError || balanceQuery.isError,
    hasEnough: fee <= 0 || balance >= fee,
  }
}
