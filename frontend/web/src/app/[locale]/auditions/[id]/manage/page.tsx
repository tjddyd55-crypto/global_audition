'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { auditionApi } from '../../../../../lib/api/auditions'
import { AuditionManageList } from '@/components/audition/AuditionManageList'
import { useAuthStore } from '@/lib/auth/authStore'
import { canManageAudition } from '@/lib/audition/auditionPermissions'
import { auditionHeadlineTitle } from '@/lib/types/audition'

export default function AuditionManagePage() {
  const params = useParams()
  const t = useTranslations('common')
  const auditionId = params.id as string
  const accessToken = useAuthStore((s) => s.accessToken)
  const myUserId = useAuthStore((s) => s.userId)
  const role = useAuthStore((s) => s.role)

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', auditionId, myUserId ?? 'anon'],
    queryFn: () => auditionApi.getById(auditionId),
    enabled: !!auditionId,
  })

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl">{t('loading')}</div>
      </div>
    )
  }

  if (error || !audition) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-red-600">{t('error')}</div>
      </div>
    )
  }

  const showAddSeriesRound = canManageAudition({
    accessToken,
    userId: myUserId,
    ownerId: audition.ownerId,
    role,
  })

  return (
    <AuditionManageList
      auditionId={auditionId}
      auditionTitleFallback={auditionHeadlineTitle(audition)}
      processMode={audition.processMode ?? 'SINGLE'}
      showAddSeriesRound={showAddSeriesRound}
    />
  )
}
