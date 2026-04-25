'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/shared/api/auditions'
import { useParams } from 'next/navigation'
import { useAuthStore } from '@/shared/auth/authStore'
import MobileAuditionDetailSummary from './components/MobileAuditionDetailSummary'
import MobileAuditionApplyBar from './components/MobileAuditionApplyBar'

export default function MobileAuditionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const myUserId = useAuthStore((s) => s.userId)
  const role = useAuthStore((s) => s.role)

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', id, myUserId ?? 'anon'],
    queryFn: () => auditionApi.getById(id),
    enabled: !!id,
  })

  const seriesRound = audition?.round ?? 1
  const isApplicantRole = role === 'APPLICANT' || role === 'ADMIN'
  const alreadyApplied =
    audition?.status === 'OPEN' && isApplicantRole && audition?.hasApplied === true
  const applyBlocked =
    audition?.status === 'OPEN' &&
    isApplicantRole &&
    seriesRound >= 2 &&
    audition?.canApply === false

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">로딩 중...</div>
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">오디션을 찾을 수 없습니다</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24">
      <MobileAuditionDetailSummary
        audition={audition}
        alreadyApplied={alreadyApplied}
        applyBlocked={applyBlocked}
      />
      <MobileAuditionApplyBar
        audition={audition}
        auditionId={id}
        alreadyApplied={alreadyApplied}
        applyBlocked={applyBlocked}
      />
    </div>
  )
}
