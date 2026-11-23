import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { auditionSavesApi } from '../../api/endpoints'
import { queryKeys } from '../../api/queryKeys'
import { useAuth } from '../../auth/AuthProvider'

export function useSavedAuditionIds() {
  const { isAuthenticated } = useAuth()
  const query = useQuery({
    queryKey: queryKeys.savedAuditionIds,
    queryFn: auditionSavesApi.ids,
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
  return {
    ...query,
    isAuthenticated,
    saved: new Set(query.data ?? []),
  }
}

export function useToggleSavedAudition() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()

  const mutation = useMutation({
    mutationFn: async ({ auditionId, next }: { auditionId: string; next: boolean }) => {
      if (next) await auditionSavesApi.save(auditionId)
      else await auditionSavesApi.unsave(auditionId)
      return { auditionId, next }
    },
    onMutate: async ({ auditionId, next }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.savedAuditionIds })
      const previous = queryClient.getQueryData<string[]>(queryKeys.savedAuditionIds)
      const current = new Set(previous ?? [])
      if (next) current.add(auditionId)
      else current.delete(auditionId)
      queryClient.setQueryData(queryKeys.savedAuditionIds, Array.from(current))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(queryKeys.savedAuditionIds, ctx.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.savedAuditionIds })
      void queryClient.invalidateQueries({ queryKey: queryKeys.savedAuditions })
    },
  })

  const toggle = (auditionId: string, isSaved: boolean) => {
    if (!isAuthenticated) {
      Alert.alert(t('savedAuditions.menu'), t('savedAuditions.loginRequired'), [
        { text: t('common.close'), style: 'cancel' },
        { text: t('savedAuditions.loginAction'), onPress: () => router.push('/(auth)/login') },
      ])
      return
    }
    mutation.mutate({ auditionId, next: !isSaved })
  }

  return { ...mutation, toggle }
}
