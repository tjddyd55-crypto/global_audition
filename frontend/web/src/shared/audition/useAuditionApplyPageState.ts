'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { auditionApi } from '@/shared/api/auditions'
import { authApi } from '@/shared/api/auth'
import { meProfileApi } from '@/shared/api/meProfile'
import { useAuthStore } from '@/shared/auth/authStore'

export function useAuditionApplyPageState(auditionId: string) {
  const role = useAuthStore((s) => s.role)
  const token = authApi.getToken()
  const locale = useLocale()

  const { data: audition, isLoading } = useQuery({
    queryKey: ['audition', auditionId, locale],
    queryFn: () => auditionApi.getById(auditionId, locale),
    enabled: !!auditionId,
  })

  const isOpenAudition = audition?.status === 'OPEN'
  const isApplicantRole = role === 'APPLICANT' || role === 'ADMIN'
  const showCreditQueries = !!auditionId && isOpenAudition && !!token && isApplicantRole

  const { data: meProfile, isFetched: meProfileFetched } = useQuery({
    queryKey: ['me-profile', 'apply-prefill'],
    queryFn: () => meProfileApi.get(),
    enabled: showCreditQueries,
    staleTime: 60_000,
  })

  return {
    audition,
    isLoading,
    role,
    token,
    isOpenAudition,
    isApplicantRole,
    showCreditQueries,
    meProfile,
    meProfileFetched,
  }
}
