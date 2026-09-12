'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { Link } from '@/i18n.config'
import {
  adminAuditionRoundsApi,
  type AdminAuditionRoundRow,
  type AdminRoundApplicantRow,
} from '@/shared/api/adminAuditionRounds'
import { BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'

type Props = {
  auditionId: string
  auditionTitle: string
  applicantsHubHref?: string
  statusManageHref?: string
}

export function AuditionRoundReviewPanel({
  auditionId,
  auditionTitle,
  applicantsHubHref,
  statusManageHref,
}: Props) {
  const t = useTranslations('roundReview')
  const tAgency = useTranslations('agency')
  const tRanking = useTranslations('ranking')
  const applicantsHref = applicantsHubHref ?? `/my/applicants?auditionId=${encodeURIComponent(auditionId)}`
  const manageHref = statusManageHref ?? `/my/auditions/${auditionId}/manage`
  const queryClient = useQueryClient()
  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(null)

  const roundsQuery = useQuery({
    queryKey: ['admin-audition-rounds', auditionId],
    queryFn: () => adminAuditionRoundsApi.listRounds(auditionId),
    enabled: !!auditionId,
    retry: false,
  })

  const roundsSorted = useMemo(
    () => [...(roundsQuery.data ?? [])].sort((a, b) => a.roundNumber - b.roundNumber),
    [roundsQuery.data],
  )

  useEffect(() => {
    if (selectedRoundId != null || roundsSorted.length === 0) return
    setSelectedRoundId(roundsSorted[0].id)
  }, [roundsSorted, selectedRoundId])

  const applicantsQuery = useQuery({
    queryKey: ['admin-round-applicants', auditionId, selectedRoundId],
    queryFn: () => adminAuditionRoundsApi.listApplicants(auditionId, selectedRoundId!),
    enabled: !!auditionId && !!selectedRoundId,
    retry: false,
  })

  const openMutation = useMutation({
    mutationFn: (roundId: string) => adminAuditionRoundsApi.openRound(auditionId, roundId),
    onSuccess: () => {
      toast.success(t('opened'))
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error(t('openFailed')),
  })

  const closeMutation = useMutation({
    mutationFn: (roundId: string) => adminAuditionRoundsApi.closeRound(auditionId, roundId),
    onSuccess: () => {
      toast.success(t('closed'))
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error(t('closeFailed')),
  })

  const passMutation = useMutation({
    mutationFn: ({ applicationId, roundId }: { applicationId: string; roundId: string }) =>
      adminAuditionRoundsApi.pass(applicationId, roundId),
    onSuccess: () => {
      toast.success(t('passed'))
      queryClient.invalidateQueries({ queryKey: ['admin-round-applicants', auditionId, selectedRoundId] })
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error(t('passFailed')),
  })

  const failMutation = useMutation({
    mutationFn: ({ applicationId, roundId }: { applicationId: string; roundId: string }) =>
      adminAuditionRoundsApi.fail(applicationId, roundId),
    onSuccess: () => {
      toast.success(t('failed'))
      queryClient.invalidateQueries({ queryKey: ['admin-round-applicants', auditionId, selectedRoundId] })
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error(t('failFailed')),
  })

  const holdMutation = useMutation({
    mutationFn: ({ applicationId, roundId }: { applicationId: string; roundId: string }) =>
      adminAuditionRoundsApi.hold(applicationId, roundId),
    onSuccess: () => {
      toast.success(t('held'))
      queryClient.invalidateQueries({ queryKey: ['admin-round-applicants', auditionId, selectedRoundId] })
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error(t('holdFailed')),
  })

  if (roundsQuery.isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">{tAgency('loading')}</div>
  }

  if (roundsQuery.isError) {
    return (
      <div className={`${PAGE_CONTAINER} py-12 text-center`}>
        <p className="text-sm text-red-600">{t('loadRoundsFailed')}</p>
        <Link href={manageHref} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← {t('statusManage')}
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="border-b border-violet-100 bg-white py-8">
        <div className={PAGE_CONTAINER}>
          <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 no-underline hover:underline">
            ← {tRanking('backToAudition')}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className={`${TEXT_SUB} mt-1`}>{auditionTitle}</p>
          <Link href={applicantsHref} className="mt-3 inline-block text-sm text-violet-600 no-underline hover:underline">
            {t('applicantsBoard')}
          </Link>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} mt-6 grid gap-6 lg:grid-cols-[320px_1fr]`}>
        <div className={CARD_BASE}>
          <h2 className="text-lg font-semibold text-gray-900">{t('roundList')}</h2>
          <p className={`${TEXT_SUB} mt-1 text-xs`}>{t('roundListHint')}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {roundsSorted.map((r: AdminAuditionRoundRow) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => setSelectedRoundId(r.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selectedRoundId === r.id ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {t('roundName', { n: r.roundNumber, name: r.roundName })}
                  </div>
                  <div className={`${TEXT_SUB} text-xs`}>{t('method', { method: r.reviewMethod })}</div>
                  <div className="mt-1 text-xs font-medium text-gray-700">
                    {t('statusLine')}{' '}
                    <span className={r.active ? 'text-green-700' : 'text-gray-500'}>{r.active ? 'OPEN' : 'CLOSED'}</span>
                  </div>
                </button>
                <div className="mt-1 flex gap-2">
                  <button
                    type="button"
                    disabled={r.active || openMutation.isPending}
                    className={`${BTN_SECONDARY} flex-1 py-1.5 text-xs`}
                    onClick={() => openMutation.mutate(r.id)}
                  >
                    {t('open')}
                  </button>
                  <button
                    type="button"
                    disabled={!r.active || closeMutation.isPending}
                    className={`${BTN_SECONDARY} flex-1 py-1.5 text-xs`}
                    onClick={() => closeMutation.mutate(r.id)}
                  >
                    {t('close')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={CARD_BASE}>
          {!selectedRoundId ? (
            <p className="text-sm text-gray-600">{t('pickRound')}</p>
          ) : applicantsQuery.isLoading ? (
            <p className="text-sm text-gray-600">{t('loadingApplicants')}</p>
          ) : applicantsQuery.isError ? (
            <p className="text-sm text-red-600">{t('loadApplicantsFailed')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500">
                    <th className="py-2 pr-3">{t('colName')}</th>
                    <th className="py-2 pr-3">{t('colCurrentRound')}</th>
                    <th className="py-2 pr-3">{t('colSubmission')}</th>
                    <th className="py-2 pr-3">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(applicantsQuery.data ?? []).map((row: AdminRoundApplicantRow) => (
                    <tr key={row.roundSubmissionId} className="border-b border-gray-100">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-gray-900">{row.applicantDisplayName ?? '—'}</div>
                        <div className={`${TEXT_SUB} text-xs`}>{row.applicantEmail ?? ''}</div>
                      </td>
                      <td className="py-2 pr-3">{row.applicationCurrentRoundNumber}</td>
                      <td className="py-2 pr-3">{row.submissionStatus}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            disabled={passMutation.isPending}
                            onClick={() => passMutation.mutate({ applicationId: row.applicationId, roundId: selectedRoundId })}
                          >
                            {tAgency('pass')}
                          </button>
                          <button
                            type="button"
                            className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            disabled={failMutation.isPending}
                            onClick={() => failMutation.mutate({ applicationId: row.applicationId, roundId: selectedRoundId })}
                          >
                            {tAgency('dropped')}
                          </button>
                          <button
                            type="button"
                            className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            disabled={holdMutation.isPending}
                            onClick={() => holdMutation.mutate({ applicationId: row.applicationId, roundId: selectedRoundId })}
                          >
                            {t('hold')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(applicantsQuery.data ?? []).length === 0 ? (
                <p className={`${TEXT_SUB} mt-4 text-sm`}>{t('emptyRound')}</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
