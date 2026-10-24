'use client'

import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useAuditionDetailState } from '@/shared/audition/useAuditionDetailState'
import PageSurface from '@/components/layout/PageSurface'
import CenteredPageState from '@/components/layout/CenteredPageState'
import { TranslationNotice, useContentTranslation } from '@/components/i18n/TranslatedField'
import { overlayPosting } from '@/shared/i18n/postingTranslation'
import MobileAuditionDetailSummary from './components/MobileAuditionDetailSummary'
import MobileAuditionApplyBar from './components/MobileAuditionApplyBar'

export default function MobileAuditionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('common')
  const tDetail = useTranslations('auditionDetail')
  const { audition, isLoading, error, alreadyApplied, applyBlocked, isOpen } = useAuditionDetailState(id)
  const posting = useContentTranslation('AUDITION_POSTING', id)

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

  const shown = overlayPosting(audition, posting.view)

  return (
    <PageSurface style={{ paddingBottom: 'calc(9rem + env(safe-area-inset-bottom, 0px))' }}>
      <div className="px-4 pt-3" data-testid="posting-translation-notice">
        <TranslationNotice view={posting.view} showOriginal={posting.showOriginal} onToggle={posting.setShowOriginal} />
      </div>
      <MobileAuditionDetailSummary
        audition={shown}
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
