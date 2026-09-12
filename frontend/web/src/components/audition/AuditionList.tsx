'use client'

import { useState } from 'react'
import { useLocale } from 'next-intl'
import { AuditionAudienceFilter } from './AuditionAudienceFilter'
import { useAuditionsListQuery, type AudienceScope } from './useAuditionsListQuery'
import AuditionListContent from './AuditionListContent'

export default function AuditionList() {
  const locale = useLocale()
  const [scope, setScope] = useState<AudienceScope>('region')
  const { data, isLoading, error } = useAuditionsListQuery(scope)

  return (
    <div className="min-w-0">
      <AuditionAudienceFilter locale={locale} scope={scope} onChange={setScope} />
      <AuditionListContent auditions={data} isLoading={isLoading} error={error} />
    </div>
  )
}
