'use client'

import { useQuery } from '@tanstack/react-query'
import { pointsApi } from '@/shared/api/points'
import { useAuthStore } from '@/shared/auth/authStore'

export function usePointQuote(enabled: boolean) {
  const actor = useAuthStore(state => state.userId)
  return useQuery({ queryKey: ['points', 'quote', actor], queryFn: pointsApi.quote, enabled, retry: false })
}
