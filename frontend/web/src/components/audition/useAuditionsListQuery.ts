'use client'

import { useQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'
import { auditionApi } from '@/shared/api/auditions'

export function useAuditionsListQuery() {
  const locale = useLocale()
  return useQuery({
    queryKey: ['auditions', locale],
    queryFn: () => auditionApi.listOpen(locale),
  })
}
