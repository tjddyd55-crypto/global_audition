'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/shared/api/client'
import { useAuthStore } from '@/shared/auth/authStore'
import { toast } from 'sonner'

export type SavedApplicant = { applicationId: string; roundNumber: number; savedBy: string; savedAt: string; memo: string | null }

export function useApplicantShortlist(auditionId: string, round: number) {
  const client = useQueryClient()
  const actor = useAuthStore(s => s.userId)
  const key = ['applicant-shortlist', auditionId, round, actor] as const
  const url = `/auditions/${auditionId}/applications/shortlist`
  const query = useQuery({ queryKey: key, queryFn: async () => (await apiClient.get<SavedApplicant[]>(url, { params: { round } })).data,
    enabled: !!auditionId && !!actor, refetchInterval: 15000, refetchOnWindowFocus: true })
  const mutation = useMutation({
    mutationFn: async ({ ids, saved }: { ids: string[]; saved: boolean }) => { await apiClient.post(url, { applicationIds: ids, saved }, { params: { round } }) },
    onMutate: async ({ ids, saved }) => {
      await client.cancelQueries({ queryKey: key })
      const before = client.getQueryData<SavedApplicant[]>(key)
      client.setQueryData<SavedApplicant[]>(key, (old = []) => {
        const next = old.filter(x => !ids.includes(x.applicationId))
        return saved ? [...next, ...ids.map(applicationId => old.find(x => x.applicationId === applicationId) ?? { applicationId, roundNumber: round, memo: null, savedBy: '', savedAt: '' })] : next
      })
      return { before }
    },
    onError: (_error, _vars, context) => { client.setQueryData(key, context?.before ?? []); toast.error('관심 저장에 실패했습니다. 다시 시도해 주세요.') },
    onSettled: () => { client.invalidateQueries({ queryKey: key }); client.invalidateQueries({ predicate: q => q.queryKey.includes(auditionId) && q.queryKey[0] !== 'applicant-shortlist' }) },
  })
  const entries = query.data ?? []
  return { entries, pending: mutation.isPending, error: query.isError,
    change: (ids: string[], saved: boolean) => mutation.mutate({ ids, saved }),
    saveMemo: async (id: string, memo: string) => { await apiClient.put(`${url}/${id}/memo`, { memo }, { params: { round } }); await client.invalidateQueries({ queryKey: key }) } }
}

export function ApplicantStar({ saved, disabled, onClick }: { saved: boolean; disabled?: boolean; onClick: () => void }) {
  return <button type="button" aria-label={saved ? '관심 지원자 해제' : '관심 지원자 등록'} aria-pressed={saved} disabled={disabled} onClick={onClick}
    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border text-3xl disabled:opacity-50 ${saved ? 'border-yellow-300 bg-yellow-50 text-yellow-500' : 'border-gray-200 bg-white text-gray-500'}`}>{saved ? '★' : '☆'}</button>
}
