'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { auditionApi, type ManageApplicantItem, type ManageApplicationsPayload } from '@/lib/api/auditions'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  CARD_MEDIA_SHELL,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'
import { Link } from '@/i18n.config'

function formatCount(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n)
}

type AgencyApplicationStatus = 'REVIEWING' | 'ACCEPTED' | 'REJECTED'

function statusBadgeClass(status: ManageApplicantItem['status']) {
  if (status === 'REVIEWING') return 'bg-blue-50 text-blue-700'
  if (status === 'ACCEPTED') return 'bg-green-50 text-green-700'
  if (status === 'REJECTED') return 'bg-red-50 text-red-700'
  return 'bg-white/90 text-gray-900 border border-gray-200'
}

function statusLabel(status: ManageApplicantItem['status']) {
  if (status === 'REVIEWING') return '검토중'
  if (status === 'ACCEPTED') return '합격'
  if (status === 'REJECTED') return '불합격'
  return '제출'
}

function categoryPillClass(category: string) {
  const c = (category ?? '').toLowerCase()
  if (c.includes('보컬') || c.includes('vocal')) return 'bg-blue-500/90 text-white'
  if (c.includes('댄스') || c.includes('dance')) return 'bg-pink-500/90 text-white'
  if (c.includes('랩') || c.includes('rap')) return 'bg-orange-500/90 text-white'
  if (c.includes('프로듀싱') || c.includes('produc')) return 'bg-emerald-600/90 text-white'
  return 'bg-gray-700/80 text-white'
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
  const [patchingId, setPatchingId] = useState<string | null>(null)

  const qk = [queryKeyPrefix, auditionId, categoryFilter ?? '전체'] as const

  const { data: payload, isLoading, error } = useQuery({
    queryKey: qk,
    queryFn: () => auditionApi.listManageApplications(auditionId, categoryFilter),
    enabled: !!auditionId,
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

  const patchMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AgencyApplicationStatus }) =>
      auditionApi.updateApplicationStatus(id, status),
    onMutate: async ({ id, status }) => {
      setPatchingId(id)
      await queryClient.cancelQueries({ queryKey: qk })
      const previous = queryClient.getQueryData<ManageApplicationsPayload>(qk)
      queryClient.setQueryData<ManageApplicationsPayload>(qk, (old) => {
        if (!old) return old
        const nextStatus =
          status === 'REVIEWING' ? ('REVIEWING' as const) : status === 'ACCEPTED' ? ('ACCEPTED' as const) : ('REJECTED' as const)
        return {
          ...old,
          items: old.items.map((it) =>
            it.applicationId === id ? { ...it, status: nextStatus } : it
          ),
        }
      })
      return { previous }
    },
    onError: (_err, _vars, context) => {
      if (context?.previous !== undefined) {
        queryClient.setQueryData(qk, context.previous)
      }
      toast.error('상태 변경에 실패했습니다.')
    },
    onSuccess: () => {
      toast.success('저장되었습니다.')
    },
    onSettled: () => {
      setPatchingId(null)
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, auditionId] })
    },
  })

  const runPatch = (id: string, status: AgencyApplicationStatus) => {
    patchMutation.mutate({ id, status })
  }

  const terminal = (s: ManageApplicantItem['status']) => s === 'ACCEPTED' || s === 'REJECTED'

  const titleFromApi = payload?.audition?.title

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg font-medium text-gray-900">로딩 중…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-lg text-red-600">데이터를 불러오지 못했습니다.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="border-b border-violet-100 bg-gradient-to-b from-violet-50 to-white"
        style={{ paddingTop: 32, paddingBottom: 28 }}
      >
        <div className={PAGE_CONTAINER}>
          <Link href={backHref} className="text-sm font-medium text-violet-600 no-underline hover:underline">
            {backLabel}
          </Link>
          <h1 className={`${TITLE_PAGE} mt-3 text-2xl font-bold text-gray-900`}>지원자 관리</h1>
          <p className={`${TEXT_SUB} mt-1 text-base text-gray-700`}>{titleFromApi || auditionTitle}</p>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} py-6 ${SECTION_GAP}`}>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard label="전체" value={stats.total} tone="violet" />
          <StatCard label="제출" value={stats.submitted} tone="neutral" />
          <StatCard label="검토중" value={stats.reviewing} tone="blue" />
          <StatCard label="합격" value={stats.accepted} tone="green" />
          <StatCard label="불합격" value={stats.rejected} tone="red" />
        </div>

        {categories.length > 0 && (
          <div>
            <p className={`${TEXT_SUB} mb-2 flex items-center gap-2 font-medium text-gray-900`}>
              <span aria-hidden>🔽</span> 카테고리 필터
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <FilterChip
                  key={c.name}
                  active={
                    (c.name === '전체' && categoryFilter === null) ||
                    (c.name !== '전체' && categoryFilter === c.name)
                  }
                  onClick={() => setCategoryFilter(c.name === '전체' ? null : c.name)}
                  label={`${c.name}${c.name === '전체' ? '' : ` (${c.count})`}`}
                />
              ))}
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className={CARD_BASE}>
            <p className={`${TEXT_SUB} text-center`}>표시할 지원자가 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((app) => (
              <div key={app.applicationId} className={`${CARD_MEDIA_SHELL} flex flex-col`}>
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-gray-200">
                  {app.thumbnailUrl ? (
                    <Image
                      src={app.thumbnailUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 25vw"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">썸네일 없음</div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  <div className="absolute left-2 top-2 flex flex-col gap-1">
                    <span className="rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
                      👁 {formatCount(app.viewCount)}
                    </span>
                    <span className="rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
                      ♥ {formatCount(app.likeCount)}
                    </span>
                    <span className="rounded-full bg-black/55 px-2 py-0.5 text-xs font-medium text-white">
                      투표 {formatCount(app.voteCount)}
                    </span>
                  </div>

                  <div className="absolute right-2 top-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(app.status)}`}>
                      {statusLabel(app.status)}
                    </span>
                  </div>

                  {app.videoUrl ? (
                    <a
                      href={app.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg ring-4 ring-white/30 hover:bg-violet-700"
                      aria-label="영상 재생"
                    >
                      <span className="ml-1 text-2xl">▶</span>
                    </a>
                  ) : null}

                  {app.category ? (
                    <div className="absolute bottom-3 left-2">
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${categoryPillClass(app.category)}`}>
                        {app.category}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="space-y-3 border-t border-[#E5E7EB] p-4">
                  {app.recommendedRank != null && app.recommendedScore != null ? (
                    <p className="text-xs text-gray-500">
                      추천 {app.recommendedRank}위 · {app.recommendedScore.toFixed(1)}점
                    </p>
                  ) : null}
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{app.userName || '지원자'}</p>
                    <p className={`${TEXT_SUB} truncate`}>{app.userEmail}</p>
                  </div>

                  {!terminal(app.status) && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={patchingId === app.applicationId}
                        className={`${BTN_SECONDARY} !w-auto flex-1 min-w-[4rem] justify-center text-xs ${
                          app.status === 'REVIEWING' ? 'ring-2 ring-violet-500' : ''
                        }`}
                        onClick={() => runPatch(app.applicationId, 'REVIEWING')}
                      >
                        검토
                      </button>
                      <button
                        type="button"
                        disabled={patchingId === app.applicationId}
                        className={`${BTN_PRIMARY} !w-auto flex-1 min-w-[4rem] justify-center bg-emerald-600 text-xs hover:bg-emerald-700`}
                        onClick={() => runPatch(app.applicationId, 'ACCEPTED')}
                      >
                        합격
                      </button>
                      <button
                        type="button"
                        disabled={patchingId === app.applicationId}
                        className="shrink-0 flex-1 min-w-[4rem] rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => runPatch(app.applicationId, 'REJECTED')}
                      >
                        불합격
                      </button>
                    </div>
                  )}
                  {terminal(app.status) && <p className={`${TEXT_SUB} text-center text-xs`}>처리가 완료되었습니다.</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string
  value: number
  tone: 'violet' | 'neutral' | 'blue' | 'green' | 'red'
}) {
  const color =
    tone === 'violet'
      ? 'text-violet-600'
      : tone === 'blue'
        ? 'text-blue-600'
        : tone === 'green'
          ? 'text-green-600'
          : tone === 'red'
            ? 'text-red-600'
            : 'text-gray-900'
  return (
    <div className={`${CARD_BASE} text-center`}>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className={TEXT_SUB}>{label}</div>
    </div>
  )
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full bg-violet-600 px-3 py-1.5 text-sm font-medium text-white'
          : 'rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50'
      }
    >
      {label}
    </button>
  )
}
