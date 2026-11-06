'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { listMyPostingBranches } from '@/shared/api/postingBranches'
import {
  postingBranchFieldState,
  type PostingBranchFieldState,
  type PostingBranchOption,
  type SavedPostingBranch,
  type ShownPostingBranch,
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

export function usePostingBranchChoice(
  selectedId: string,
  saved?: SavedPostingBranch | null,
  awaitingSaved = false,
) {
  const query = useQuery({
    queryKey: ['my-posting-branches'],
    queryFn: listMyPostingBranches,
    staleTime: 30_000,
  })
  const state = useMemo(
    () => postingBranchFieldState(query.data, selectedId, query.isError, saved, awaitingSaved),
    [awaitingSaved, query.data, query.isError, saved, selectedId],
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
      {state.kind === 'none' ? <NoneNotice /> : null}
      {state.kind === 'fixed' ? <FixedNotice branch={state.branch} /> : null}
      {state.kind === 'choose' ? (
        <ChooseNotice branches={state.branches} selectedId={state.selectedId} onSelect={onSelect} />
      ) : null}
      {state.kind === 'stale' ? <StaleNotice saved={state.saved} choices={state.choices} onSelect={onSelect} /> : null}
      <span className="mt-1 block text-xs text-gray-500">{t('postingBranchHint')}</span>
    </div>
  )
}

function NoneNotice() {
  const t = useTranslations('editor')
  return (
    <p role="status" className="text-sm text-amber-800" data-testid="posting-branch-none">
      {t('postingBranchNone')}
    </p>
  )
}

function FixedNotice({ branch }: { branch: PostingBranchOption }) {
  const t = useTranslations('editor')
  return (
    <p data-testid="posting-branch-fixed" className="text-sm text-gray-800">
      {t('postingBranchFixed', { name: branch.displayName, country: branch.countryCode })}
    </p>
  )
}

function ChooseNotice({
  branches,
  selectedId,
  onSelect,
}: {
  branches: PostingBranchOption[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const selected = branches.find((branch) => branch.id === selectedId)
  return (
    <>
      {selected ? <FixedNotice branch={selected} /> : null}
      <BranchSelect branches={branches} selectedId={selectedId} onSelect={onSelect} />
    </>
  )
}

function StaleNotice({
  saved,
  choices,
  onSelect,
}: {
  saved: ShownPostingBranch
  choices: PostingBranchOption[]
  onSelect: (id: string) => void
}) {
  const t = useTranslations('editor')
  return (
    <>
      <p role="status" className="mb-2 text-sm text-amber-800" data-testid="posting-branch-stale">
        {unusableMessage(t, saved)}
      </p>
      {choices.length > 0 ? (
        <BranchSelect branches={choices} selectedId="" onSelect={onSelect} />
      ) : (
        <NoneNotice />
      )}
    </>
  )
}

function unusableMessage(
  t: ReturnType<typeof useTranslations<'editor'>>,
  saved: ShownPostingBranch,
): string {
  const country = saved.countryCode.trim()
  if (!country) return t('postingBranchUnusableUnknown')
  const name = saved.displayName.trim() || t('postingBranchSavedName')
  return t('postingBranchUnusable', { name, country })
}

function BranchSelect({
  branches,
  selectedId,
  onSelect,
}: {
  branches: PostingBranchOption[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  const t = useTranslations('editor')
  return (
    <select
      value={selectedId}
      onChange={(event) => onSelect(event.target.value)}
      style={fieldStyle}
      data-testid="posting-branch-select"
      required
    >
      <option value="">{t('postingBranchPlaceholder')}</option>
      {branches.map((branch) => (
        <option key={branch.id} value={branch.id}>
          {t('postingBranchFixed', { name: branch.displayName, country: branch.countryCode })}
        </option>
      ))}
    </select>
  )
}
