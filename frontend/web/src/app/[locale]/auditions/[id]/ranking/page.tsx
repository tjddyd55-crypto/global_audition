'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { auditionApi } from '../../../../../lib/api/auditions'
import { AuditionRankingBoard } from '@/components/audition/AuditionRankingBoard'

export default function AuditionRankingPage() {
  const params = useParams()
  const t = useTranslations('common')
  const auditionId = params.id as string

  const { data: audition, isLoading, error } = useQuery({
    queryKey: ['audition', auditionId],
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

  return <AuditionRankingBoard auditionId={auditionId} auditionTitleFallback={audition.title} />
}
