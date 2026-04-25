'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/shared/api/auditions'
import { useAuthStore } from '@/shared/auth/authStore'
import { safeStr } from '@/shared/utils/safe'
import type { AuditionDto } from '@/shared/types/audition'

export type AuditionDetailState = {
  audition: AuditionDto | undefined
  isLoading: boolean
  error: Error | null
  accessToken: string | null
  role: string | null
  isOpen: boolean
  isAuthenticated: boolean
  isApplicantRole: boolean
  alreadyApplied: boolean
  isMultiRoundAudition: boolean
  seriesRound: number
  applyBlocked: boolean
  showApplyLoginCta: boolean
  showApplySubmitCta: boolean
  showApplyDisabledCta: boolean
}

export function useAuditionDetailState(auditionId: string): AuditionDetailState {
  const accessToken = useAuthStore((s) => s.accessToken)
  const myUserId = useAuthStore((s) => s.userId)
  const role = useAuthStore((s) => s.role)

  const { data: audition, isLoading, error } = useQuery({
    /** 로그인 전후 hasApplied 등 뷰어 전용 필드 반영 */
    queryKey: ['audition', auditionId, myUserId ?? 'anon'],
    queryFn: () => auditionApi.getById(auditionId),
    enabled: !!auditionId,
  })

  const isOpen = audition?.status === 'OPEN'
  const isAuthenticated = !!accessToken
  const isApplicantRole = role === 'APPLICANT' || role === 'ADMIN'
  const seriesRound = audition?.round ?? 1
  const alreadyApplied = Boolean(isOpen && isApplicantRole && audition?.hasApplied === true)
  const isMultiRoundAudition = safeStr(audition?.processMode) === 'MULTI_ROUND'
  const applyBlocked = Boolean(
    isOpen && isApplicantRole && seriesRound >= 2 && audition?.canApply === false,
  )
  const showApplyLoginCta = Boolean(isOpen && !isAuthenticated)
  const showApplySubmitCta = Boolean(isOpen && isAuthenticated && isApplicantRole)
  const showApplyDisabledCta = Boolean(isOpen && isAuthenticated && !showApplySubmitCta)

  return {
    audition,
    isLoading,
    error: error instanceof Error ? error : error ? new Error(String(error)) : null,
    accessToken,
    role,
    isOpen,
    isAuthenticated,
    isApplicantRole,
    alreadyApplied,
    isMultiRoundAudition,
    seriesRound,
    applyBlocked,
    showApplyLoginCta,
    showApplySubmitCta,
    showApplyDisabledCta,
  }
}
