'use client'

import { useState } from 'react'
import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  auditionApi,
  type AgencyBoardStatus,
  type ApplicationAgencyDetail,
  type ManageApplicationsPayload,
} from '@/shared/api/auditions'

function toastMessageForPatchSuccess(status: AgencyBoardStatus) {
  if (status === 'APPROVED') return '합격 처리되었습니다.'
  if (status === 'REJECTED') return '불합격 처리되었습니다.'
  if (status === 'REVIEWING') return '검토중으로 변경되었습니다.'
  if (status === 'PENDING') return '대기 상태로 변경되었습니다.'
  return '저장되었습니다.'
}

type UseApplicantStatusMutationParams = {
  listQueryKey: QueryKey
  listInvalidateQueryKey: QueryKey
  panelAppId: string | null
}

export function useApplicantStatusMutation({
  listQueryKey,
  listInvalidateQueryKey,
  panelAppId,
}: UseApplicantStatusMutationParams) {
  const queryClient = useQueryClient()
  const [patchingId, setPatchingId] = useState<string | null>(null)

  const detailQueryKey = (applicationId: string) => ['application-agency-detail', applicationId] as const

  const patchMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AgencyBoardStatus }) =>
      auditionApi.updateApplicationStatus(id, status),
    onMutate: async ({ id, status }) => {
      setPatchingId(id)
      await queryClient.cancelQueries({ queryKey: listQueryKey })
      await queryClient.cancelQueries({ queryKey: detailQueryKey(id) })
      const previous = queryClient.getQueryData<ManageApplicationsPayload>(listQueryKey)
      const previousDetail = queryClient.getQueryData<ApplicationAgencyDetail>(detailQueryKey(id))
      queryClient.setQueryData<ManageApplicationsPayload>(listQueryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((it) => (it.applicationId === id ? { ...it, status } : it)),
        }
      })
      queryClient.setQueryData<ApplicationAgencyDetail>(detailQueryKey(id), (old) => {
        if (!old || old.id !== id) return old
        return { ...old, status }
      })
      return { previous, previousDetail }
    },
    onError: (_err, vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(listQueryKey, context.previous)
      }
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(detailQueryKey(vars.id), context.previousDetail)
      }
      toast.error('상태 변경에 실패했습니다.')
    },
    onSuccess: (_data, variables) => {
      toast.success(toastMessageForPatchSuccess(variables.status))
    },
    onSettled: () => {
      setPatchingId(null)
      queryClient.invalidateQueries({ queryKey: listInvalidateQueryKey })
      if (panelAppId) {
        queryClient.invalidateQueries({ queryKey: detailQueryKey(panelAppId) })
      }
    },
  })

  const runPatch = (id: string, status: AgencyBoardStatus) => {
    patchMutation.mutate({ id, status })
  }

  return { patchingId, runPatch }
}
