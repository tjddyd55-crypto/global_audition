'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { toast } from 'sonner'
import { Link, useRouter } from '@/i18n.config'
import { auditionApi, getManageList, type ManageApplicantItem } from '@/shared/api/auditions'
import { ALL_CATEGORY_SENTINEL, isAllCategoryName } from '@/shared/audition/allCategorySentinel'
import { BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'

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
  const t = useTranslations('agency')
  const tCommon = useTranslations('common')
  const tStatus = useTranslations('status')
  const resolvedBackHref = backHref ?? `/auditions/${auditionId}`
  const resolvedRoundReviewHref = roundReviewHref ?? `/my/auditions/${auditionId}/round-review`
  const queryClient = useQueryClient()
  const router = useRouter()
  const [category, setCategory] = useState<string | null>(null)

  const addSeriesMutation = useMutation({
    mutationFn: () => auditionApi.createNextSeriesRound(auditionId),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['audition', auditionId] })
      toast.success(t('roundCreated'))
      router.push(`/auditions/${created.id}/edit`)
    },
    onError: (e) => {
      const msg = isAxiosError(e)
        ? (e.response?.data as { message?: string } | undefined)?.message
        : undefined
      toast.error(msg || t('roundCreateFailed'))
    },
  })

  const listQuery = useQuery({
    queryKey: ['audition-manage', auditionId, category ?? ALL_CATEGORY_SENTINEL],
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
      toast.success(t('statusChanged'))
    },
    onError: () => toast.error(t('statusFailed')),
  })

  const busy = patchMutation.isPending

  if (listQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">{t('loading')}</div>
    )
  }

  if (listQuery.isError) {
    const forbidden = isAxiosError(listQuery.error) && listQuery.error.response?.status === 403
    return (
      <div className={`${PAGE_CONTAINER} py-12 text-center`}>
        <p className="text-sm text-red-600">
          {forbidden ? t('agencyAdminOnly') : tCommon('loadFailedTitle')}
        </p>
        <Link href={resolvedBackHref} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← {tCommon('back')}
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
          ← {tCommon('back')}
        </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('manageTitle')}</h1>
          <p className={`${TEXT_SUB} mt-1`}>{auditionTitleFallback}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {showAddSeriesRound ? (
              <button
                type="button"
                disabled={addSeriesMutation.isPending}
                onClick={() => addSeriesMutation.mutate()}
                className="inline-flex min-h-11 whitespace-normal break-words rounded-lg border border-violet-600 bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {addSeriesMutation.isPending ? t('creating') : t('addRound')}
              </button>
            ) : null}
            {processMode === 'MULTI_ROUND' ? (
              <Link
                href={resolvedRoundReviewHref}
                className="inline-flex min-h-11 whitespace-normal break-words rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 no-underline hover:bg-violet-100"
              >
                {t('multiRoundReview')}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} mt-6 flex flex-col gap-6`}>
        {stats ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <StatCard label={t('all')} value={stats.total} />
            <StatCard label={t('submittedShort')} value={stats.submitted} />
            <StatCard label={t('reviewingShort')} value={stats.reviewing} />
            <StatCard label={tStatus('accepted')} value={stats.accepted} />
            <StatCard label={tStatus('rejected')} value={stats.rejected} />
          </div>
        ) : null}

        {categories.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => {
              const isAll = isAllCategoryName(c.name)
              return (
                <button
                  key={c.name}
                  type="button"
                  disabled={busy}
                  onClick={() => setCategory(isAll ? null : c.name)}
                  className={
                    (isAll && category === null) || c.name === category
                      ? 'min-h-11 whitespace-normal break-words rounded-full bg-violet-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50'
                      : 'min-h-11 whitespace-normal break-words rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50'
                  }
                >
                  {isAll ? t('all') : c.name}
                  {isAll ? '' : ` ${c.count}`}
                </button>
              )
            })}
          </div>
        ) : null}

        <div className="flex flex-col gap-4">
          {items.length === 0 ? (
            <p className={TEXT_SUB}>{t('emptyVisible')}</p>
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
      <div className={`${TEXT_SUB} whitespace-normal break-words`}>{label}</div>
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
  const t = useTranslations('agency')
  const tStatus = useTranslations('status')
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
        <p className="text-base font-semibold text-gray-900">{app.userName || t('nameNone')}</p>
        <p className={`${TEXT_SUB} text-sm`}>{t('statusColon', { status: st })}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={disabled} className={btnClass('REVIEWING')} onClick={() => onPatch('REVIEWING')}>
          {tStatus('underReview')}
        </button>
        <button type="button" disabled={disabled} className={btnClass('APPROVED')} onClick={() => onPatch('APPROVED')}>
          {tStatus('accepted')}
        </button>
        <button type="button" disabled={disabled} className={btnClass('REJECTED')} onClick={() => onPatch('REJECTED')}>
          {tStatus('rejected')}
        </button>
      </div>
    </div>
  )
}
