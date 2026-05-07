'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  auditionApi,
  type AgencyBoardStatus,
  type ApplicationAgencyDetail,
  type ManageApplicationsPayload,
  type ManageListFilters,
  type ManageRoundCount,
} from '@/shared/api/auditions'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import {
  ApplicantCategoryFilterChips,
  ApplicantEmptyListState,
  ApplicantManagementContentShell,
  ApplicantManagementFilterPanel,
  ApplicantManagementHeader,
  ApplicantManagementPageState,
  ApplicantRoundTabs,
  ApplicantStatsGrid,
  type RoundTabValue,
} from '@/components/audition/manage'
import { ApplicantListRow } from '@/components/audition/manage/list'
import {
  ApplicantDetailActionBar,
  ApplicantDetailBasicInfo,
  ApplicantDetailIntroSection,
  ApplicantDetailPanelHeader,
  ApplicantDetailPanelState,
  ApplicantDetailSnsSection,
  ApplicantDetailVideoSection,
  ApplicantStatusConfirmDialog,
} from '@/components/audition/manage/detail'

function toastMessageForPatchSuccess(status: AgencyBoardStatus) {
  if (status === 'APPROVED') return '합격 처리되었습니다.'
  if (status === 'REJECTED') return '불합격 처리되었습니다.'
  if (status === 'REVIEWING') return '검토중으로 변경되었습니다.'
  if (status === 'PENDING') return '대기 상태로 변경되었습니다.'
  return '저장되었습니다.'
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
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [minAge, setMinAge] = useState<string>('')
  const [maxAge, setMaxAge] = useState<string>('')
  const [nationalityFilter, setNationalityFilter] = useState<string>('')
  const [hasSnsFilter, setHasSnsFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [roundTab, setRoundTab] = useState<RoundTabValue>('all')
  const [patchingId, setPatchingId] = useState<string | null>(null)
  const [panelAppId, setPanelAppId] = useState<string | null>(null)

  const listFilters: ManageListFilters = useMemo(() => {
    const f: ManageListFilters = { category: categoryFilter }
    if (minAge.trim() !== '') {
      const n = Number(minAge)
      if (!Number.isNaN(n)) f.minAge = n
    }
    if (maxAge.trim() !== '') {
      const n = Number(maxAge)
      if (!Number.isNaN(n)) f.maxAge = n
    }
    if (nationalityFilter) f.nationality = nationalityFilter
    if (hasSnsFilter === 'yes') f.hasSns = true
    if (hasSnsFilter === 'no') f.hasSns = false
    if (statusFilter) f.status = statusFilter as AgencyBoardStatus
    if (roundTab !== 'all') f.round = roundTab
    return f
  }, [categoryFilter, minAge, maxAge, nationalityFilter, hasSnsFilter, statusFilter, roundTab])

  const qk = [queryKeyPrefix, auditionId, listFilters] as const

  const { data: payload, isLoading, error } = useQuery({
    queryKey: qk,
    queryFn: () => auditionApi.listManageApplications(auditionId, listFilters),
    enabled: !!auditionId,
  })

  const detailQuery = useQuery({
    queryKey: ['application-agency-detail', panelAppId],
    queryFn: () => auditionApi.getApplicationAgencyDetail(panelAppId!),
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

  const detailQueryKey = (applicationId: string) => ['application-agency-detail', applicationId] as const

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
      toast.error('상태 변경에 실패했습니다.')
    },
    onSuccess: (_data, variables) => {
      toast.success(toastMessageForPatchSuccess(variables.status))
    },
    onSettled: () => {
      setPatchingId(null)
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, auditionId] })
      if (panelAppId) {
        queryClient.invalidateQueries({ queryKey: detailQueryKey(panelAppId) })
      }
    },
  })

  const runPatch = (id: string, status: AgencyBoardStatus) => {
    patchMutation.mutate({ id, status })
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
    return <ApplicantManagementPageState message="로딩 중…" />
  }

  if (error) {
    return <ApplicantManagementPageState message="데이터를 불러오지 못했습니다." tone="danger" />
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

        <ApplicantStatsGrid stats={stats} />

        <ApplicantManagementFilterPanel
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
                app={app}
                onOpen={() => setPanelAppId(app.applicationId)}
              />
            ))}
          </div>
        )}
      </ApplicantManagementContentShell>

      {panelAppId ? (
        <AgencyDetailPanel
          applicationId={panelAppId}
          detail={detailQuery.data}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          onClose={() => setPanelAppId(null)}
          patchingId={patchingId}
          onPatch={runPatch}
        />
      ) : null}
    </div>
  )
}

function AgencyDetailPanel({
  applicationId,
  detail,
  isLoading,
  isError,
  onClose,
  patchingId,
  onPatch,
}: {
  applicationId: string
  detail: ApplicationAgencyDetail | undefined
  isLoading: boolean
  isError: boolean
  onClose: () => void
  patchingId: string | null
  onPatch: (id: string, s: AgencyBoardStatus) => void
}) {
  const [confirmStatus, setConfirmStatus] = useState<AgencyBoardStatus | null>(null)
  const patching = patchingId === applicationId

  const embed = detail?.videoUrl ? getVideoEmbedSrc(detail.videoUrl) : ''
  const detailThumb = detail ? resolveVideoThumbnailUrl(detail.videoUrl ?? '', detail.thumbnailUrl ?? null) : null

  const birth = detail?.birthDate
    ? (() => {
        try {
          return format(new Date(detail.birthDate!), 'yyyy-MM-dd', { locale: ko })
        } catch {
          return detail.birthDate
        }
      })()
    : '—'

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[60] bg-black/40"
        aria-label="패널 닫기"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
      >
        <ApplicantDetailPanelHeader onClose={onClose} />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {isLoading ? <ApplicantDetailPanelState message="불러오는 중…" /> : null}
          {isError ? <ApplicantDetailPanelState message="상세를 불러오지 못했습니다." tone="danger" /> : null}
          {detail && (
            <div className="flex flex-col gap-6">
              <ApplicantDetailVideoSection
                videoUrl={detail.videoUrl}
                embedUrl={embed}
                thumbnailUrl={detailThumb}
              />
              <ApplicantDetailBasicInfo detail={detail} birthLabel={birth} />
              <ApplicantDetailSnsSection snsLinks={detail.snsLinks} />
              <ApplicantDetailIntroSection introText={detail.introText} />
            </div>
          )}
        </div>

        {detail ? (
          <ApplicantDetailActionBar
            currentStatus={detail.status}
            patching={patching}
            onRequestStatusChange={setConfirmStatus}
          />
        ) : null}
      </aside>
      {confirmStatus != null ? (
        <ApplicantStatusConfirmDialog
          status={confirmStatus}
          patching={patching}
          onCancel={() => setConfirmStatus(null)}
          onConfirm={() => {
            onPatch(applicationId, confirmStatus)
            setConfirmStatus(null)
          }}
        />
      ) : null}
    </>
  )
}
