'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { auditionApi } from '@/shared/api/auditions'
import { normalizeAudienceCountry } from '@/shared/audition/audienceSelection'

export function useAuditionsListQuery(country: string) {
  const locale = useLocale()
  const scope = normalizeAudienceCountry(country)
  return useQuery({
    queryKey: ['auditions', locale, scope],
    queryFn: () => auditionApi.listOpen(locale, scope),
    retry: 1,
  })
}
