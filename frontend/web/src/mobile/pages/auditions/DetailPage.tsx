'use client'

import { useParams } from 'next/navigation'
import { useAuditionDetailState } from '@/shared/audition/useAuditionDetailState'
import PageSurface from '@/components/layout/PageSurface'
import CenteredPageState from '@/components/layout/CenteredPageState'
import MobileAuditionDetailSummary from './components/MobileAuditionDetailSummary'
import MobileAuditionApplyBar from './components/MobileAuditionApplyBar'

export default function MobileAuditionDetailPage() {
  const params = useParams()
  const id = params.id as string
  const { audition, isLoading, error, alreadyApplied, applyBlocked } = useAuditionDetailState(id)

  if (isLoading) {
    return (
      <CenteredPageState className="min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </CenteredPageState>
    )
  }

  if (error || !audition) {
    return (
      <CenteredPageState className="min-h-screen">
        <div className="text-xl text-red-600">오디션을 찾을 수 없습니다</div>
      </CenteredPageState>
    )
  }

  return (
    <PageSurface className="pb-24">
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
    </PageSurface>
  )
}
