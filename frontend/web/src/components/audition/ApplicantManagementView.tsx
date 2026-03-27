'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { toast } from 'sonner'
import {
  auditionApi,
  type AgencyBoardStatus,
  type ApplicationAgencyDetail,
  type ManageApplicantItem,
  type ManageApplicationsPayload,
  type ManageListFilters,
} from '@/lib/api/auditions'
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  CARD_BASE,
  PAGE_CONTAINER,
  SECTION_GAP,
  TEXT_SUB,
  TITLE_PAGE,
} from '@/lib/ui/specClasses'
import { Link } from '@/i18n.config'
import { getVideoEmbedSrc } from '@/lib/utils/videoEmbed'

function formatCount(n: number) {
  return new Intl.NumberFormat('ko-KR').format(n)
}

const NATIONALITY_LABEL: Record<string, string> = {
  KR: '대한민국',
  MN: '몽골',
  JP: '일본',
  OTHER: '기타',
}

const SNS_PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'X',
  facebook: 'Facebook',
  other: '기타',
}

function statusBadgeClass(status: AgencyBoardStatus) {
  if (status === 'REVIEWING') return 'bg-blue-50 text-blue-700'
  if (status === 'APPROVED') return 'bg-green-50 text-green-700'
  if (status === 'REJECTED') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-800'
}

function statusLabel(status: AgencyBoardStatus) {
  if (status === 'REVIEWING') return '검토중'
  if (status === 'APPROVED') return '합격'
  if (status === 'REJECTED') return '탈락'
  return '대기'
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
    return f
  }, [categoryFilter, minAge, maxAge, nationalityFilter, hasSnsFilter, statusFilter])

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

  const patchMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AgencyBoardStatus }) =>
      auditionApi.updateApplicationStatus(id, status),
    onMutate: async ({ id, status }) => {
      setPatchingId(id)
      await queryClient.cancelQueries({ queryKey: qk })
      const previous = queryClient.getQueryData<ManageApplicationsPayload>(qk)
      queryClient.setQueryData<ManageApplicationsPayload>(qk, (old) => {
        if (!old) return old
        return {
          ...old,
          items: old.items.map((it) => (it.applicationId === id ? { ...it, status } : it)),
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
      if (panelAppId) {
        queryClient.invalidateQueries({ queryKey: ['application-agency-detail', panelAppId] })
      }
    },
  })

  const runPatch = (id: string, status: AgencyBoardStatus) => {
    patchMutation.mutate({ id, status })
  }

  const terminal = (s: AgencyBoardStatus) => s === 'APPROVED' || s === 'REJECTED'

  const titleFromApi = payload?.audition?.title

  useEffect(() => {
    if (!panelAppId) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPanelAppId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelAppId])

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
          <StatCard label="대기(미심사)" value={stats.submitted} tone="neutral" />
          <StatCard label="검토중" value={stats.reviewing} tone="blue" />
          <StatCard label="합격" value={stats.accepted} tone="green" />
          <StatCard label="탈락" value={stats.rejected} tone="red" />
        </div>

        <div className={`${CARD_BASE} flex flex-col gap-4`}>
          <p className={`${TEXT_SUB} font-semibold text-gray-900`}>필터</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-600">나이 최소</span>
              <input
                type="number"
                min={0}
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-2"
                placeholder="예: 18"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-600">나이 최대</span>
              <input
                type="number"
                min={0}
                value={maxAge}
                onChange={(e) => setMaxAge(e.target.value)}
                className="rounded-lg border border-gray-200 px-2 py-2"
                placeholder="예: 35"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-600">국적</span>
              <select
                value={nationalityFilter}
                onChange={(e) => setNationalityFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2"
              >
                <option value="">전체</option>
                <option value="KR">대한민국</option>
                <option value="MN">몽골</option>
                <option value="JP">일본</option>
                <option value="OTHER">기타</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-gray-600">심사 상태</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2"
              >
                <option value="">전체</option>
                <option value="PENDING">대기</option>
                <option value="REVIEWING">검토중</option>
                <option value="APPROVED">합격</option>
                <option value="REJECTED">탈락</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm sm:col-span-2 lg:col-span-1">
              <span className="text-gray-600">SNS</span>
              <select
                value={hasSnsFilter}
                onChange={(e) => setHasSnsFilter(e.target.value as 'all' | 'yes' | 'no')}
                className="rounded-lg border border-gray-200 bg-white px-2 py-2"
              >
                <option value="all">전체</option>
                <option value="yes">있음</option>
                <option value="no">없음</option>
              </select>
            </label>
          </div>
        </div>

        {categories.length > 0 && (
          <div>
            <p className={`${TEXT_SUB} mb-2 flex items-center gap-2 font-medium text-gray-900`}>분야(영상 카테고리)</p>
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
      </div>

      {panelAppId ? (
        <AgencyDetailPanel
          applicationId={panelAppId}
          detail={detailQuery.data}
          isLoading={detailQuery.isLoading}
          isError={detailQuery.isError}
          onClose={() => setPanelAppId(null)}
          patchingId={patchingId}
          onPatch={runPatch}
          terminal={terminal}
        />
      ) : null}
    </div>
  )
}

function ApplicantListRow({ app, onOpen }: { app: ManageApplicantItem; onOpen: () => void }) {
  const applied = app.createdAt
    ? (() => {
        try {
          return format(new Date(app.createdAt), 'yyyy.MM.dd', { locale: ko })
        } catch {
          return '—'
        }
      })()
    : '—'

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full cursor-pointer gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left shadow-sm transition hover:border-violet-200 hover:bg-violet-50/40 md:items-center md:gap-4 md:p-4"
    >
      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-200 md:h-20 md:w-[4.5rem]">
        {app.thumbnailUrl ? (
          <Image src={app.thumbnailUrl} alt="" fill className="object-cover" sizes="72px" unoptimized />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-700/80 to-fuchsia-700/80 text-lg text-white">
            ▶
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-gray-900">{app.name || app.userName || '지원자'}</span>
          <span className="text-sm text-gray-500">{app.age != null ? `${app.age}세` : '나이 —'}</span>
          <span className="text-sm text-gray-500">
            {app.nationality ? NATIONALITY_LABEL[app.nationality] ?? app.nationality : '국적 —'}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span>SNS {formatCount(app.snsCount)}</span>
          <span>·</span>
          <span>지원 {applied}</span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(app.status)}`}>
          {statusLabel(app.status)}
        </span>
        <span className={`${BTN_SECONDARY} !w-auto !py-1.5 !text-xs`}>보기</span>
      </div>
    </button>
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
  terminal,
}: {
  applicationId: string
  detail: ApplicationAgencyDetail | undefined
  isLoading: boolean
  isError: boolean
  onClose: () => void
  patchingId: string | null
  onPatch: (id: string, s: AgencyBoardStatus) => void
  terminal: (s: AgencyBoardStatus) => boolean
}) {
  const embed = detail?.videoUrl ? getVideoEmbedSrc(detail.videoUrl) : ''

  const birth = detail?.birthDate
    ? (() => {
        try {
          return format(new Date(detail.birthDate!), 'yyyy-MM-dd', { locale: ko })
        } catch {
          return detail.birthDate
        }
      })()
    : '—'

  const nat = detail?.nationality
    ? NATIONALITY_LABEL[detail.nationality] ?? detail.nationality
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
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <h2 className="text-lg font-bold text-gray-900">지원자 상세</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            닫기
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {isLoading && <p className="text-sm text-gray-500">불러오는 중…</p>}
          {isError && <p className="text-sm text-red-600">상세를 불러오지 못했습니다.</p>}
          {detail && (
            <div className="flex flex-col gap-6">
              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">지원 영상</h3>
                <div className="overflow-hidden rounded-xl bg-black">
                  {embed ? (
                    <div className="relative aspect-video w-full">
                      <iframe
                        title="application-video"
                        src={embed}
                        className="absolute inset-0 h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : detail.thumbnailUrl ? (
                    <a
                      href={detail.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="relative block aspect-video w-full"
                    >
                      <Image src={detail.thumbnailUrl} alt="" fill className="object-cover" unoptimized />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/35 text-4xl text-white">
                        ▶
                      </span>
                    </a>
                  ) : (
                    <div className="py-12 text-center">
                      <a
                        href={detail.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-violet-200 underline"
                      >
                        새 창에서 영상 열기
                      </a>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-2 text-sm">
                <h3 className="text-sm font-semibold text-gray-900">기본 정보</h3>
                <p>
                  <span className="text-gray-500">이름 </span>
                  <span className="font-medium text-gray-900">{detail.name}</span>
                </p>
                <p>
                  <span className="text-gray-500">나이 </span>
                  <span className="font-medium text-gray-900">{detail.age != null ? `${detail.age}세` : '—'}</span>
                </p>
                <p>
                  <span className="text-gray-500">생년월일 </span>
                  <span className="font-medium text-gray-900">{birth}</span>
                </p>
                <p>
                  <span className="text-gray-500">국적 </span>
                  <span className="font-medium text-gray-900">{nat}</span>
                </p>
                <p>
                  <span className="text-gray-500">상태 </span>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(detail.status)}`}>
                    {statusLabel(detail.status)}
                  </span>
                </p>
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">SNS</h3>
                {detail.snsLinks.length === 0 ? (
                  <p className="text-sm text-gray-500">등록된 SNS가 없습니다.</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.snsLinks.map((l, i) => (
                      <li key={`${l.platform}-${i}`}>
                        <a
                          href={l.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-violet-700 underline hover:text-violet-900"
                        >
                          {SNS_PLATFORM_LABEL[l.platform] ?? l.platform}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">지원 동기 · 자기소개</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                  {detail.introText?.trim() ? detail.introText : '작성 내용이 없습니다.'}
                </p>
              </section>

              {!terminal(detail.status) && (
                <div className="flex flex-col gap-2 border-t border-gray-100 pt-4 sm:flex-row">
                  <button
                    type="button"
                    disabled={patchingId === applicationId}
                    className={`${BTN_PRIMARY} flex-1 justify-center bg-amber-600 hover:bg-amber-700`}
                    onClick={() => onPatch(applicationId, 'PENDING')}
                  >
                    대기
                  </button>
                  <button
                    type="button"
                    disabled={patchingId === applicationId}
                    className={`${BTN_SECONDARY} flex-1 justify-center`}
                    onClick={() => onPatch(applicationId, 'REVIEWING')}
                  >
                    검토(보류)
                  </button>
                  <button
                    type="button"
                    disabled={patchingId === applicationId}
                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                    onClick={() => onPatch(applicationId, 'APPROVED')}
                  >
                    합격
                  </button>
                  <button
                    type="button"
                    disabled={patchingId === applicationId}
                    className="flex-1 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                    onClick={() => onPatch(applicationId, 'REJECTED')}
                  >
                    탈락
                  </button>
                </div>
              )}
              {terminal(detail.status) && (
                <p className={`${TEXT_SUB} text-center text-xs`}>처리가 완료된 지원서입니다.</p>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
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
