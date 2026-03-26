'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { auditionApi } from '../../../../../lib/api/auditions'
import { AuditionRoundReviewPanel } from '@/components/audition/AuditionRoundReviewPanel'
import { PAGE_CONTAINER, TEXT_SUB } from '@/lib/ui/specClasses'
import { Link } from '@/i18n.config'

export default function AuditionRoundReviewPage() {
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

  if (audition.processMode !== 'MULTI_ROUND') {
    return (
      <div className={`${PAGE_CONTAINER} py-16`}>
        <h1 className="text-xl font-semibold text-gray-900">다단계 라운드 심사</h1>
        <p className={`${TEXT_SUB} mt-2`}>이 오디션은 단일(SINGLE) 모드입니다. 지원자 상태 관리 화면을 이용해 주세요.</p>
        <Link href={`/auditions/${auditionId}/manage`} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← 지원자 상태 관리
        </Link>
      </div>
    )
  }

  return <AuditionRoundReviewPanel auditionId={auditionId} auditionTitle={audition.title} />
}
