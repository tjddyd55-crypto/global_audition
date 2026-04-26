'use client'

import { useAuditionsListQuery } from './useAuditionsListQuery'
import AuditionListContent from './AuditionListContent'

export default function AuditionList() {
  const { data, isLoading, error } = useAuditionsListQuery()

  return <AuditionListContent auditions={data} isLoading={isLoading} error={error} />
}
