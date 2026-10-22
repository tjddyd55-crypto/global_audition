'use client'

import { AuditionAudienceFilter } from './AuditionAudienceFilter'
import { useAuditionsListQuery } from './useAuditionsListQuery'
import { useAudienceCountrySelection } from '@/shared/audition/useAudienceCountrySelection'
import AuditionListContent from './AuditionListContent'

export default function AuditionList() {
  const { country, selectCountry } = useAudienceCountrySelection()
  const { data, isLoading, error } = useAuditionsListQuery(country)

  return (
    <div className="min-w-0">
      <AuditionAudienceFilter country={country} onChange={selectCountry} />
      <AuditionListContent auditions={data} isLoading={isLoading} error={error} />
    </div>
  )
}
