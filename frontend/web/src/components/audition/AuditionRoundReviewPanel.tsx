'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@/i18n.config'
import {
  adminAuditionRoundsApi,
  type AdminAuditionRoundRow,
  type AdminRoundApplicantRow,
} from '@/lib/api/adminAuditionRounds'
import { BTN_PRIMARY, BTN_SECONDARY, CARD_BASE, PAGE_CONTAINER, TEXT_SUB } from '@/lib/ui/specClasses'

type Props = {
  auditionId: string
  auditionTitle: string
  /** 기본: 기획사 허브 지원자 관리 */
  applicantsHubHref?: string
  /** 기본: 시리즈·간편 상태 관리 */
  statusManageHref?: string
}

export function AuditionRoundReviewPanel({
  auditionId,
  auditionTitle,
  applicantsHubHref,
  statusManageHref,
}: Props) {
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
    [roundsQuery.data]
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
      toast.success('라운드를 열었습니다.')
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error('오픈 처리에 실패했습니다.'),
  })

  const closeMutation = useMutation({
    mutationFn: (roundId: string) => adminAuditionRoundsApi.closeRound(auditionId, roundId),
    onSuccess: () => {
      toast.success('라운드를 닫았습니다.')
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error('종료 처리에 실패했습니다.'),
  })

  const passMutation = useMutation({
    mutationFn: ({ applicationId, roundId }: { applicationId: string; roundId: string }) =>
      adminAuditionRoundsApi.pass(applicationId, roundId),
    onSuccess: () => {
      toast.success('합격 처리했습니다.')
      queryClient.invalidateQueries({ queryKey: ['admin-round-applicants', auditionId, selectedRoundId] })
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error('합격 처리에 실패했습니다.'),
  })

  const failMutation = useMutation({
    mutationFn: ({ applicationId, roundId }: { applicationId: string; roundId: string }) =>
      adminAuditionRoundsApi.fail(applicationId, roundId),
    onSuccess: () => {
      toast.success('탈락 처리했습니다.')
      queryClient.invalidateQueries({ queryKey: ['admin-round-applicants', auditionId, selectedRoundId] })
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error('탈락 처리에 실패했습니다.'),
  })

  const holdMutation = useMutation({
    mutationFn: ({ applicationId, roundId }: { applicationId: string; roundId: string }) =>
      adminAuditionRoundsApi.hold(applicationId, roundId),
    onSuccess: () => {
      toast.success('보류 처리했습니다.')
      queryClient.invalidateQueries({ queryKey: ['admin-round-applicants', auditionId, selectedRoundId] })
      queryClient.invalidateQueries({ queryKey: ['admin-audition-rounds', auditionId] })
    },
    onError: () => toast.error('보류 처리에 실패했습니다.'),
  })

  if (roundsQuery.isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">불러오는 중…</div>
  }

  if (roundsQuery.isError) {
    return (
      <div className={`${PAGE_CONTAINER} py-12 text-center`}>
        <p className="text-sm text-red-600">라운드 목록을 불러오지 못했습니다. 권한을 확인해 주세요.</p>
        <Link href={manageHref} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← 상태 관리
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="border-b border-violet-100 bg-white py-8">
        <div className={PAGE_CONTAINER}>
          <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 no-underline hover:underline">
            ← 오디션 상세
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">다단계 라운드 관리</h1>
          <p className={`${TEXT_SUB} mt-1`}>{auditionTitle}</p>
          <Link href={applicantsHref} className="mt-3 inline-block text-sm text-violet-600 no-underline hover:underline">
            지원자 관리(보드) →
          </Link>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} mt-6 grid gap-6 lg:grid-cols-[320px_1fr]`}>
        <div className={CARD_BASE}>
          <h2 className="text-lg font-semibold text-gray-900">라운드 목록</h2>
          <p className={`${TEXT_SUB} mt-1 text-xs`}>항목을 선택하면 해당 라운드 지원자를 심사합니다.</p>
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
                    {r.roundNumber}차 {r.roundName}
                  </div>
                  <div className={`${TEXT_SUB} text-xs`}>방식: {r.reviewMethod}</div>
                  <div className="mt-1 text-xs font-medium text-gray-700">
                    상태:{' '}
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
                    오픈
                  </button>
                  <button
                    type="button"
                    disabled={!r.active || closeMutation.isPending}
                    className={`${BTN_SECONDARY} flex-1 py-1.5 text-xs`}
                    onClick={() => closeMutation.mutate(r.id)}
                  >
                    종료
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className={CARD_BASE}>
          {!selectedRoundId ? (
            <p className="text-sm text-gray-600">왼쪽에서 라운드를 선택하세요.</p>
          ) : applicantsQuery.isLoading ? (
            <p className="text-sm text-gray-600">지원자 목록을 불러오는 중…</p>
          ) : applicantsQuery.isError ? (
            <p className="text-sm text-red-600">지원자 목록을 불러오지 못했습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500">
                    <th className="py-2 pr-3">이름</th>
                    <th className="py-2 pr-3">현재 라운드</th>
                    <th className="py-2 pr-3">제출 상태</th>
                    <th className="py-2 pr-3">액션</th>
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
                            합격
                          </button>
                          <button
                            type="button"
                            className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            disabled={failMutation.isPending}
                            onClick={() => failMutation.mutate({ applicationId: row.applicationId, roundId: selectedRoundId })}
                          >
                            탈락
                          </button>
                          <button
                            type="button"
                            className="rounded bg-amber-500 px-2 py-1 text-xs font-semibold text-white disabled:opacity-50"
                            disabled={holdMutation.isPending}
                            onClick={() => holdMutation.mutate({ applicationId: row.applicationId, roundId: selectedRoundId })}
                          >
                            보류
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(applicantsQuery.data ?? []).length === 0 ? (
                <p className={`${TEXT_SUB} mt-4 text-sm`}>이 라운드에 등록된 지원자가 없습니다.</p>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
