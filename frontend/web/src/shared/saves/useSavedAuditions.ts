'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/shared/auth/authStore'
import { authApi } from '@/shared/api/auth'
import { auditionSaveQueryKeys, auditionSavesApi } from '@/shared/api/auditionSaves'

export function useSavedAuditionIds(enabled = true) {
  const token = useAuthStore((s) => s.accessToken) || (typeof window !== 'undefined' ? authApi.getToken() : null)
  const query = useQuery({
    queryKey: auditionSaveQueryKeys.ids,
    queryFn: auditionSavesApi.ids,
    enabled: Boolean(enabled && token),
    staleTime: 30_000,
  })
  return {
    ...query,
    isAuthenticated: Boolean(token),
    saved: new Set(query.data ?? []),
  }
}

export function useToggleSavedAudition() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ auditionId, next }: { auditionId: string; next: boolean }) => {
      if (next) await auditionSavesApi.save(auditionId)
      else await auditionSavesApi.unsave(auditionId)
      return { auditionId, next }
    },
    onMutate: async ({ auditionId, next }) => {
      await queryClient.cancelQueries({ queryKey: auditionSaveQueryKeys.ids })
      const previous = queryClient.getQueryData<string[]>(auditionSaveQueryKeys.ids)
      const current = new Set(previous ?? [])
      if (next) current.add(auditionId)
      else current.delete(auditionId)
      queryClient.setQueryData(auditionSaveQueryKeys.ids, Array.from(current))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(auditionSaveQueryKeys.ids, ctx.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: auditionSaveQueryKeys.ids })
      void queryClient.invalidateQueries({ queryKey: auditionSaveQueryKeys.list })
    },
  })
}
