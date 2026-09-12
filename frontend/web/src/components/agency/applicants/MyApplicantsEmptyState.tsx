'use client'

import { useTranslations } from 'next-intl'
import { PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'

type MyApplicantsEmptyStateProps = {
  hasAuditions: boolean
}

export default function MyApplicantsEmptyState({ hasAuditions }: MyApplicantsEmptyStateProps) {
  const tAgency = useTranslations('agency')

  return (
    <div className={`${PAGE_CONTAINER} py-10`}>
      <h1 className="text-xl font-semibold text-gray-900">{tAgency('applicants')}</h1>
      <p className={`${TEXT_SUB} mt-2`}>
        {!hasAuditions ? tAgency('noAuditionsHint') : tAgency('pickAudition')}
      </p>
    </div>
  )
}
