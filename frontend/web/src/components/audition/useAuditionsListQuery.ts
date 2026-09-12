'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { auditionApi } from '@/shared/api/auditions'
import { audienceCountryFromLocale } from '@/shared/audition/audience'

export type AudienceScope = 'region' | 'all'

export function useAuditionsListQuery(scope: AudienceScope = 'region') {
  const locale = useLocale()
  const country = scope === 'all' ? 'ALL' : audienceCountryFromLocale(locale)
  return useQuery({
    queryKey: ['auditions', locale, country],
    queryFn: () => auditionApi.listOpen(locale, country),
  })
}
