'use client'

import { useQuery } from '@tanstack/react-query'
import { auditionApi } from '@/shared/api/auditions'

export function useAuditionsListQuery() {
  return useQuery({
    queryKey: ['auditions'],
    queryFn: () => auditionApi.listOpen(),
  })
}
