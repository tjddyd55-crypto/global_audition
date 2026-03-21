'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { auditionApi } from '../../../../../lib/api/auditions'
import { ApplicantManagementView } from '@/components/audition/ApplicantManagementView'

export default function AuditionApplicationsPage() {
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

  return (
    <ApplicantManagementView
      auditionId={auditionId}
      auditionTitle={audition.title}
      backHref={`/auditions/${auditionId}`}
      backLabel="← 오디션 상세"
      queryKeyPrefix="audition-applications"
    />
  )
}
