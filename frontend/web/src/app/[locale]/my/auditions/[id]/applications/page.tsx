'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { auditionApi } from '../../../../../../lib/api/auditions'
import { ApplicantManagementView } from '@/components/audition/ApplicantManagementView'

export default function MyAuditionApplicationsPage() {
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('common')

  const auditionQuery = useQuery({
    queryKey: ['my-audition', id],
    queryFn: () => auditionApi.getById(id),
    enabled: !!id,
  })

  if (auditionQuery.isLoading) {
    return <div className="flex min-h-screen items-center justify-center">{t('loading')}</div>
  }
  if (!auditionQuery.data) {
    return <div className="flex min-h-screen items-center justify-center text-red-500">{t('error')}</div>
  }

  return (
    <ApplicantManagementView
      auditionId={id}
      auditionTitle={auditionQuery.data.title}
      backHref="/my/auditions"
      backLabel="← 내 오디션 목록"
      queryKeyPrefix="my-audition-applications"
    />
  )
}
