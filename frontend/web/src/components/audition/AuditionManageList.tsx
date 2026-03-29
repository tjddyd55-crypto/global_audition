'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useState } from 'react'
import { toast } from 'sonner'
import { Link, useRouter } from '@/i18n.config'
import { auditionApi, getManageList, type ManageApplicantItem } from '@/lib/api/auditions'
import { BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB } from '@/lib/ui/specClasses'

type StatusBtn = 'REVIEWING' | 'APPROVED' | 'REJECTED'

type Props = {
  auditionId: string
  auditionTitleFallback: string
  /** MULTI_ROUND 일 때 라운드 심사 화면 링크 표시 */
  processMode?: string
  /** 기획사·관리자: 다음 시리즈 차수 공고 생성 */
  showAddSeriesRound?: boolean
  /** 상단 뒤로가기(기본: 공개 상세) */
  backHref?: string
  /** 다단계 라운드 심사 링크(기본: /my/auditions/… 경로) */
  roundReviewHref?: string
}

export function AuditionManageList({
  auditionId,
  auditionTitleFallback,
  processMode,
  showAddSeriesRound = false,
  backHref,
  roundReviewHref,
}: Props) {
  const resolvedBackHref = backHref ?? `/auditions/${auditionId}`
  const resolvedRoundReviewHref = roundReviewHref ?? `/my/auditions/${auditionId}/round-review`
  const queryClient = useQueryClient()
  const router = useRouter()
  const [category, setCategory] = useState<string | null>(null)

  const addSeriesMutation = useMutation({
    mutationFn: () => auditionApi.createNextSeriesRound(auditionId),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['audition', auditionId] })
      toast.success('다음 차수 공고가 초안으로 생성되었습니다.')
      router.push(`/auditions/${created.id}/edit`)
    },
    onError: (e) => {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string } | undefined)?.message
        : undefined
      toast.error(msg || '차수 추가에 실패했습니다.')
    },
  })

  const listQuery = useQuery({
    queryKey: ['audition-manage', auditionId, category ?? '전체'],
    queryFn: () => getManageList(auditionId, category),
    enabled: !!auditionId,
    retry: false,
  })

  const patchMutation = useMutation({
    mutationFn: ({ applicationId, status }: { applicationId: string; status: StatusBtn }) =>
      auditionApi.updateApplicationStatus(applicationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audition-manage', auditionId] })
      queryClient.invalidateQueries({ queryKey: ['audition-ranking', auditionId] })
      toast.success('상태가 변경되었습니다.')
    },
    onError: () => toast.error('상태 변경에 실패했습니다.'),
  })

  const busy = patchMutation.isPending

  if (listQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">불러오는 중…</div>
    )
  }

  if (listQuery.isError) {
    const forbidden = isAxiosError(listQuery.error) && listQuery.error.response?.status === 403
    return (
      <div className={`${PAGE_CONTAINER} py-12 text-center`}>
        <p className="text-sm text-red-600">
          {forbidden ? '이 페이지는 기획사·관리자만 이용할 수 있습니다.' : '목록을 불러오지 못했습니다.'}
        </p>
        <Link href={resolvedBackHref} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← 뒤로
        </Link>
      </div>
    )
  }

  const payload = listQuery.data
  const items = payload?.items ?? []
  const stats = payload?.stats
  const categories = payload?.categories ?? []

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <div className="border-b border-violet-100 bg-white py-8">
        <div className={PAGE_CONTAINER}>
        <Link href={resolvedBackHref} className="text-sm font-medium text-violet-700 no-underline hover:underline">
          ← 뒤로
        </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">지원자 상태 관리</h1>
          <p className={`${TEXT_SUB} mt-1`}>{auditionTitleFallback}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {showAddSeriesRound ? (
              <button
                type="button"
                disabled={addSeriesMutation.isPending}
                onClick={() => addSeriesMutation.mutate()}
                className="inline-flex rounded-lg border border-violet-600 bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {addSeriesMutation.isPending ? '생성 중…' : '+ 차수 추가'}
              </button>
            ) : null}
            {processMode === 'MULTI_ROUND' ? (
              <Link
                href={resolvedRoundReviewHref}
                className="inline-flex rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 no-underline hover:bg-violet-100"
              >
                다단계 라운드 심사 · 라운드 열기/닫기
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} mt-6 flex flex-col gap-6`}>
        {stats ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label="전체" value={stats.total} />
            <StatCard label="제출" value={stats.submitted} />
            <StatCard label="검토" value={stats.reviewing} />
            <StatCard label="합격" value={stats.accepted} />
            <StatCard label="불합격" value={stats.rejected} />
          </div>
        ) : null}

        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c.name}
                type="button"
                disabled={busy}
                onClick={() => setCategory(c.name === '전체' ? null : c.name)}
                className={
                  (c.name === '전체' && category === null) || c.name === category
                    ? 'rounded-full bg-violet-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50'
                    : 'rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50'
                }
              >
                {c.name}
                {c.name !== '전체' ? ` ${c.count}` : ''}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          {items.length === 0 ? (
            <p className={TEXT_SUB}>표시할 지원자가 없습니다.</p>
          ) : (
            items.map((app) => (
              <ManageRow
                key={app.applicationId}
                app={app}
                disabled={busy}
                onPatch={(status) => patchMutation.mutate({ applicationId: app.applicationId, status })}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className={CARD_BASE + ' text-center'}>
      <div className="text-xl font-bold text-violet-600">{value}</div>
      <div className={TEXT_SUB}>{label}</div>
    </div>
  )
}

function ManageRow({
  app,
  disabled,
  onPatch,
}: {
  app: ManageApplicantItem
  disabled: boolean
  onPatch: (s: StatusBtn) => void
}) {
  const st = app.status

  const btnClass = (target: StatusBtn) => {
    const active = st === target
    if (target === 'APPROVED') {
      return active
        ? 'rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white ring-2 ring-emerald-800'
        : 'rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50'
    }
    if (target === 'REJECTED') {
      return active
        ? 'rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white ring-2 ring-red-800'
        : 'rounded-lg border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50'
    }
    return active
      ? `${BTN_SECONDARY} !w-auto ring-2 ring-violet-500`
      : `${BTN_SECONDARY} !w-auto`
  }

  return (
    <div className={`${CARD_BASE} flex flex-col gap-3 md:flex-row md:items-center md:justify-between`}>
      <div>
        <p className="text-base font-semibold text-gray-900">{app.userName || '이름 없음'}</p>
        <p className={`${TEXT_SUB} text-sm`}>상태: {st}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={disabled} className={btnClass('REVIEWING')} onClick={() => onPatch('REVIEWING')}>
          검토
        </button>
        <button type="button" disabled={disabled} className={btnClass('APPROVED')} onClick={() => onPatch('APPROVED')}>
          합격
        </button>
        <button type="button" disabled={disabled} className={btnClass('REJECTED')} onClick={() => onPatch('REJECTED')}>
          불합격
        </button>
      </div>
    </div>
  )
}
