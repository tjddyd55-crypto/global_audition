'use client'

import { adminAuditionRoundsApi } from '@/shared/api/adminAuditionRounds'
import { shortlistCopy as sc } from './manage/shortlistCopy'
import { useAuthStore } from '@/shared/auth/authStore'
import { ApplicantStar, useApplicantShortlist } from './manage/useApplicantShortlist'
import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  auditionApi,
  type AgencyBoardStatus,
  type ApplicationAgencyDetail,
  type ManageApplicationsPayload,
  type ManageRoundCount,
} from '@/shared/api/auditions'
import {
  ApplicantCategoryFilterChips,
  ApplicantEmptyListState,
  ApplicantManagementContentShell,
  ApplicantManagementFilterPanel,
  ApplicantManagementHeader,
  ApplicantManagementPageState,
  ApplicantRoundTabs,
  ApplicantStatsGrid,
} from '@/components/audition/manage'
import AgencyDetailPanel from '@/components/audition/manage/detail/AgencyDetailPanel'
import { useApplicantManageFilters } from '@/components/audition/manage/hooks/useApplicantManageFilters'
import { ApplicantListRow } from '@/components/audition/manage/list'
import { useTranslations } from 'next-intl'

function toastMessageForPatchSuccess(
  status: AgencyBoardStatus,
  t: (key: 'passDone' | 'rejectDone' | 'reviewDone' | 'pendingDone' | 'saved') => string,
) {
  if (status === 'APPROVED') return t('passDone')
  if (status === 'REJECTED') return t('rejectDone')
  if (status === 'REVIEWING') return t('reviewDone')
  if (status === 'PENDING') return t('pendingDone')
  return t('saved')
}

function subtitleFromDescription(description: string) {
  const t = (description ?? '').trim()
  if (!t) return ''
  const firstLine = t.split(/\r?\n/).find((line) => line.trim().length > 0) ?? t
  const s = firstLine.trim()
  return s.length > 200 ? `${s.slice(0, 197)}…` : s
}

function countForRound(roundCounts: ManageRoundCount[], n: number): number {
  return roundCounts.find((x) => x.round === n)?.count ?? 0
}

type Props = {
  auditionId: string
  auditionTitle: string
  backHref: string
  backLabel: string
  queryKeyPrefix?: string
}

export function ApplicantManagementView({
  auditionId,
  auditionTitle,
  backHref,
  backLabel,
  queryKeyPrefix = 'audition-manage',
}: Props) {
  const t = useTranslations('agency')
  const queryClient = useQueryClient()
  const {
    numberFilter, setNumberFilter,
    categoryFilter,
    setCategoryFilter,
    minAge,
    setMinAge,
    maxAge,
    setMaxAge,
    nationalityFilter,
    setNationalityFilter,
    hasSnsFilter,
    setHasSnsFilter,
    statusFilter,
    setStatusFilter,
    roundTab,
    setRoundTab,
    listFilters,
  } = useApplicantManageFilters()
  const [savedOnly, setSavedOnly] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [sort, setSort] = useState<'NEWEST' | 'NUMBER' | 'NAME' | 'SCORE'>('NEWEST')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const scope = roundTab === 'all' ? 0 : roundTab
  const shortlist = useApplicantShortlist(auditionId, scope)
  const requestFilters = { ...listFilters, savedOnly, name: nameFilter, sort, page, size: 50 }
  // Mutations keep the current page, filter, scroll and mounted video intact.
  useEffect(() => { setPage(0); setSelected([]) }, [auditionId, listFilters, savedOnly, nameFilter, sort])
  const [patchingId, setPatchingId] = useState<string | null>(null)
  const [panelAppId, setPanelAppId] = useState<string | null>(null)

  const actor = useAuthStore(s => s.userId)
  const qk = [queryKeyPrefix, auditionId, actor, requestFilters] as const

  const { data: payload, isLoading, error } = useQuery({
    queryKey: qk,
    queryFn: () => auditionApi.listManageApplications(auditionId, requestFilters),
    enabled: !!auditionId,
    refetchInterval: savedOnly ? 15000 : false,
  })

  const detailQuery = useQuery({
    queryKey: ['application-agency-detail', panelAppId, actor, scope],
    queryFn: () => auditionApi.getApplicationAgencyDetail(panelAppId!, scope || undefined),
    enabled: !!panelAppId,
  })

  const stats = payload?.stats ?? {
    total: 0,
    submitted: 0,
    reviewing: 0,
    accepted: 0,
    rejected: 0,
  }

  const categories = payload?.categories ?? []
  const items = payload?.items ?? []
  const auditionHeader = payload?.audition
  const applicantTotalCount = payload?.applicantTotalCount ?? items.length
  const maxRound = Math.max(1, payload?.maxRound ?? 1)
  const roundCounts = payload?.roundCounts ?? []

  const detailQueryKey = (applicationId: string) => ['application-agency-detail', applicationId, actor, scope] as const

  const patchMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AgencyBoardStatus }) =>
      auditionApi.updateApplicationStatus(id, status),
    onMutate: async ({ id, status }) => {
      setPatchingId(id)
      await queryClient.cancelQueries({ queryKey: qk })
      await queryClient.cancelQueries({ queryKey: detailQueryKey(id) })
      const previous = queryClient.getQueryData<ManageApplicationsPayload>(qk)
      const previousDetail = queryClient.getQueryData<ApplicationAgencyDetail>(detailQueryKey(id))
      queryClient.setQueryData<ManageApplicationsPayload>(qk, (old) => {
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
        queryClient.setQueryData(qk, context.previous)
      }
      if (context?.previousDetail !== undefined) {
        queryClient.setQueryData(detailQueryKey(vars.id), context.previousDetail)
      }
      toast.error(t('statusFailed'))
    },
    onSuccess: (_data, variables) => {
      toast.success(toastMessageForPatchSuccess(variables.status, t))
    },
    onSettled: () => {
      setPatchingId(null)
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, auditionId] })
      if (panelAppId) {
        queryClient.invalidateQueries({ queryKey: detailQueryKey(panelAppId) })
      }
    },
  })

  const roundDecision = useMutation({
    mutationFn: ({ id, roundId, status }: { id: string; roundId: string; status: AgencyBoardStatus }) => {
      if (status === 'APPROVED') return adminAuditionRoundsApi.pass(id, roundId)
      if (status === 'REJECTED') return adminAuditionRoundsApi.fail(id, roundId)
      return adminAuditionRoundsApi.hold(id, roundId)
    },
    onSuccess: () => {
      toast.success(t('saved'))
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, auditionId] })
      queryClient.invalidateQueries({ queryKey: ['admin-round-applicants', auditionId] })
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
      if (panelAppId) queryClient.invalidateQueries({ queryKey: detailQueryKey(panelAppId) })
    },
    onError: () => toast.error(t('statusFailed')),
  })
  const runPatch = (id: string, status: AgencyBoardStatus) => {
    const roundId = detailQuery.data?.reviewRoundId
    if (roundId) roundDecision.mutate({ id, roundId, status })
    else patchMutation.mutate({ id, status })
  }

  const displayTitle = (auditionHeader?.title?.trim() && auditionHeader.title) || auditionTitle
  const displaySubtitle = subtitleFromDescription(auditionHeader?.description ?? '')

  useEffect(() => {
    if (!panelAppId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelAppId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelAppId])

  if (isLoading) {
    return <ApplicantManagementPageState message={t('loading')} />
  }

  if (error) {
    return <ApplicantManagementPageState message={t('loadDataFailed')} tone="danger" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ApplicantManagementHeader
        backHref={backHref}
        backLabel={backLabel}
        title={displayTitle}
        subtitle={displaySubtitle}
        applicantTotalCount={applicantTotalCount}
        maxRoundNumber={auditionHeader?.maxRoundNumber ?? null}
      />

      <ApplicantManagementContentShell>
        <ApplicantRoundTabs
          value={roundTab}
          maxRound={maxRound}
          applicantTotalCount={applicantTotalCount}
          getRoundCount={(round) => countForRound(roundCounts, round)}
          onChange={setRoundTab}
        />

        <div className="mb-4 flex flex-wrap items-center gap-2" aria-label={sc.view}>
          <button type="button" aria-pressed={!savedOnly} onClick={() => setSavedOnly(false)} className={`rounded-lg border px-4 py-2 ${!savedOnly ? 'bg-violet-700 text-white' : 'bg-white'}`}>{sc.all} {scope ? countForRound(roundCounts, scope) : applicantTotalCount}{sc.people}</button>
          <button type="button" aria-pressed={savedOnly} onClick={() => setSavedOnly(true)} className={`rounded-lg border px-4 py-2 ${savedOnly ? 'bg-violet-700 text-white' : 'bg-white'}`}>{sc.saved} {shortlist.entries.length}{sc.people}</button>
          <p className="w-full text-xs text-gray-500">{sc.stageHint(scope)}</p>
          {shortlist.error ? <p role="alert" className="text-sm text-red-600">{sc.loadError}</p> : null}
        </div>
        <ApplicantStatsGrid stats={stats} />
        <div className="my-3 flex flex-wrap gap-3">
          <label className="text-sm">{sc.nameSearch}<input className="ml-2 rounded-lg border p-2" value={nameFilter} onChange={e => setNameFilter(e.target.value)} /></label>
          <label className="text-sm">{sc.sort}<select className="ml-2 rounded-lg border p-2" value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="NEWEST">{sc.newest}</option><option value="NUMBER">{sc.number}</option><option value="NAME">{sc.name}</option><option value="SCORE">{sc.score}</option></select></label>
        </div>
        <div className="my-3 flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" aria-label={sc.selectPage} checked={items.length > 0 && items.every(x => selected.includes(x.applicationId))} onChange={e => setSelected(e.target.checked ? items.map(x => x.applicationId) : [])} /> {sc.selectPage}</label>
          <span className="text-sm">{sc.bulk} {selected.length}{sc.people}</span>
          <button type="button" disabled={!selected.length || shortlist.pending || shortlist.error} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40" onClick={() => shortlist.change(selected, true)}>{sc.save}</button>
          <button type="button" disabled={!selected.length || shortlist.pending || shortlist.error} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40" onClick={() => shortlist.change(selected, false)}>{sc.unsave}</button>
        </div>

        <ApplicantManagementFilterPanel
          applicantNumber={numberFilter}
          onApplicantNumberChange={setNumberFilter}
          minAge={minAge}
          maxAge={maxAge}
          nationality={nationalityFilter}
          status={statusFilter}
          hasSns={hasSnsFilter}
          onMinAgeChange={setMinAge}
          onMaxAgeChange={setMaxAge}
          onNationalityChange={setNationalityFilter}
          onStatusChange={(next) => setStatusFilter(next)}
          onHasSnsChange={setHasSnsFilter}
        />

        <ApplicantCategoryFilterChips
          categories={categories}
          selectedCategory={categoryFilter}
          onChange={setCategoryFilter}
        />

        {items.length === 0 ? (
          <ApplicantEmptyListState />
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((app) => (
              <ApplicantListRow
                key={app.applicationId}
                reviewControls={<div className="flex shrink-0 flex-col items-center gap-2 pt-2">
                  <ApplicantStar saved={shortlist.entries.some(x => x.applicationId === app.applicationId)} disabled={shortlist.pending || shortlist.error} onClick={() => shortlist.change([app.applicationId], !shortlist.entries.some(x => x.applicationId === app.applicationId))} />
                  <input type="checkbox" aria-label={sc.select(app.name)} checked={selected.includes(app.applicationId)} onChange={e => setSelected(old => e.target.checked ? [...old, app.applicationId] : old.filter(id => id !== app.applicationId))} />
                </div>}
                app={app}
                onOpen={() => setPanelAppId(app.applicationId)}
              />
            ))}
          </div>
        )}
        <nav className="mt-4 flex items-center justify-center gap-4 pb-8" aria-label={sc.pages}>
          <button type="button" disabled={page === 0} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40" onClick={() => { setPage(page - 1); setSelected([]) }}>{sc.previous}</button>
          <span className="text-sm">{page + 1} / {Math.max(1, payload?.totalPages ?? 1)} · {payload?.totalElements ?? items.length}{sc.people}</span>
          <button type="button" disabled={page + 1 >= (payload?.totalPages ?? 1)} className="rounded-lg border bg-white px-4 py-2 disabled:opacity-40" onClick={() => { setPage(page + 1); setSelected([]) }}>{sc.next}</button>
        </nav>
      </ApplicantManagementContentShell>

      {panelAppId ? (
        <AgencyDetailPanel
          reviewRound={scope}
          applicationId={panelAppId}
          detail={detailQuery.data}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          onClose={() => setPanelAppId(null)}
          patchingId={roundDecision.isPending ? roundDecision.variables?.id ?? null : patchingId}
          canDecide={scope === 0 || auditionHeader?.processMode !== 'MULTI_ROUND' || !!detailQuery.data?.reviewRoundId}
          onPatch={runPatch}
        />
      ) : null}
    </div>
  )
}
