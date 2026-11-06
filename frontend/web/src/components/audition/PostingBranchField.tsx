'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { listMyPostingBranches } from '@/shared/api/postingBranches'
import {
  postingBranchFieldState,
  type PostingBranchFieldState,
} from '@/shared/audition/postingBranchChoice'

const fieldStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  padding: '0 12px',
  fontSize: 14,
  boxSizing: 'border-box',
  background: '#fff',
}

export function usePostingBranchChoice(selectedId: string) {
  const query = useQuery({
    queryKey: ['my-posting-branches'],
    queryFn: listMyPostingBranches,
    staleTime: 30_000,
  })
  const state = useMemo(
    () => postingBranchFieldState(query.data, selectedId, query.isError),
    [query.data, query.isError, selectedId],
  )
  return { state, isLoading: query.isLoading }
}

export function PostingBranchField({
  state,
  onSelect,
}: {
  state: PostingBranchFieldState
  onSelect: (id: string) => void
}) {
  const t = useTranslations('editor')
  if (state.kind === 'unavailable') return null
  return (
    <div style={{ marginBottom: 16 }} data-testid="posting-branch-field">
      <label style={{ display: 'block', marginBottom: 8, fontSize: 14, fontWeight: 600 }}>
        {t('postingBranch')}
      </label>
      {state.kind === 'loading' ? <p className="text-sm text-gray-500">{t('postingBranchLoading')}</p> : null}
      {state.kind === 'none' ? (
        <p role="status" className="text-sm text-amber-800" data-testid="posting-branch-none">
          {t('postingBranchNone')}
        </p>
      ) : null}
      {state.kind === 'fixed' ? (
        <p data-testid="posting-branch-fixed" className="text-sm text-gray-800">
          {t('postingBranchFixed', { name: state.branch.displayName, country: state.branch.countryCode })}
        </p>
      ) : null}
      {state.kind === 'choose' ? (
        <select
          value={state.selectedId}
          onChange={(event) => onSelect(event.target.value)}
          style={fieldStyle}
          data-testid="posting-branch-select"
          required
        >
          <option value="">{t('postingBranchPlaceholder')}</option>
          {state.branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {t('postingBranchFixed', { name: branch.displayName, country: branch.countryCode })}
            </option>
          ))}
        </select>
      ) : null}
      <span className="mt-1 block text-xs text-gray-500">{t('postingBranchHint')}</span>
    </div>
  )
}
