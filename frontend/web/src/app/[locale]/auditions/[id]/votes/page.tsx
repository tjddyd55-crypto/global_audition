'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '../../../../../i18n.config'
import { auditionApi } from '../../../../../lib/api/auditions'
import { PublicVoteBoard } from '@/components/audition/PublicVoteBoard'
import { AUDITION_DETAIL } from '@/lib/design-tokens'

export default function AuditionPublicVotesPage() {
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
    <div
      style={{
        minHeight: '100vh',
        background: AUDITION_DETAIL.pageBackgroundMuted,
        padding: `${AUDITION_DETAIL.sectionGapPx}px 16px 48px`,
      }}
    >
      <div style={{ maxWidth: AUDITION_DETAIL.containerMaxWidthPx, margin: '0 auto' }}>
        <nav style={{ marginBottom: 16 }}>
          <Link
            href={`/auditions/${auditionId}`}
            style={{ fontSize: AUDITION_DETAIL.bodyFontPx, color: '#2563eb', textDecoration: 'none' }}
          >
            ← 오디션 상세
          </Link>
        </nav>
        <PublicVoteBoard auditionId={auditionId} auditionTitle={audition.title} />
      </div>
    </div>
  )
}
