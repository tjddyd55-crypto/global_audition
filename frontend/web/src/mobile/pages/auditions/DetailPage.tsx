'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuditionDetailState } from '@/shared/audition/useAuditionDetailState'
import PageSurface from '@/components/layout/PageSurface'
import CenteredPageState from '@/components/layout/CenteredPageState'
import MobileAuditionDetailSummary from './components/MobileAuditionDetailSummary'
import MobileAuditionApplyBar from './components/MobileAuditionApplyBar'

export default function MobileAuditionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('common')
  const tDetail = useTranslations('auditionDetail')
  const { audition, isLoading, error, alreadyApplied, applyBlocked, isOpen } = useAuditionDetailState(id)

  if (isLoading) {
    return (
      <CenteredPageState className="min-h-screen">
        <div className="text-xl">{t('loading')}</div>
      </CenteredPageState>
    )
  }

  if (error || !audition) {
    return (
      <CenteredPageState className="min-h-screen">
        <div className="text-xl text-red-600">{tDetail('loadFailed')}</div>
      </CenteredPageState>
    )
  }

  return (
    <PageSurface className="pb-24">
      <MobileAuditionDetailSummary
        audition={audition}
        isOpen={isOpen}
        alreadyApplied={alreadyApplied}
        applyBlocked={applyBlocked}
      />
      <MobileAuditionApplyBar
        audition={audition}
        auditionId={id}
        alreadyApplied={alreadyApplied}
        applyBlocked={applyBlocked}
      />
    </PageSurface>
  )
}
