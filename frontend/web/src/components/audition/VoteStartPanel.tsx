'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Link } from '@/i18n.config'
import { getVoteSchedule, startAuditionVote } from '@/shared/api/auditions/votes'

/**
 * 기획사 관리 화면: 후보 확정과 투표 시작·종료 시각.
 * 기획사·관리자 화면은 한국어 전용 정책이라 문구를 카탈로그에 두지 않는다.
 */
const COPY = {
  title: '공개 투표 시작',
  hint: '후보를 확정하고 시작·종료 시각을 정한 뒤 투표 시작을 누르세요. 투표가 시작되면 공정성을 위해 후보 명단을 바꿀 수 없습니다. 투표는 서버 시각 기준으로 시작·종료됩니다.',
  startAt: '시작 시각',
  endAt: '종료 시각',
  candidates: '투표 후보',
  candidateCount: (n: number) => `확정 후보 ${n}명`,
  startAction: '투표 시작',
  saving: '저장 중…',
  needCandidates: '투표할 후보가 없습니다. 지원자를 심사·선발한 뒤 다시 시도하세요.',
  success: '투표 일정을 저장했습니다.',
  alreadyStarted: '이미 이 회차 투표를 시작했습니다.',
  locked: '투표가 시작되어 후보 명단이 확정되었습니다.',
  results: '투표 결과(랭킹) 보기',
  notThisRound: '이 회차는 공개 투표를 사용하지 않습니다.',
  loadFailed: '투표 일정을 불러오지 못했습니다.',
  status: {
    NOT_STARTED: '아직 시작 전',
    SCHEDULED: '예정',
    OPEN: '진행 중',
    CLOSED: '종료',
  } as Record<string, string>,
  allCandidates: '현재 회차에서 투표 가능한 지원자 모두',
}

function toLocalInput(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultWindow(): { startAt: string; endAt: string } {
  const start = new Date()
  start.setSeconds(0, 0)
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000)
  return { startAt: toLocalInput(start.toISOString()), endAt: toLocalInput(end.toISOString()) }
}

function toIso(local: string): string {
  const d = new Date(local)
  if (Number.isNaN(d.getTime())) {
    throw new Error('invalid-date')
  }
  return d.toISOString()
}

type ApplicantOpt = { applicationId: string; name: string }

export function VoteStartPanel({
  auditionId,
  applicants = [],
}: {
  auditionId: string
  applicants?: ApplicantOpt[]
}) {
  const queryClient = useQueryClient()
  const defaults = useMemo(defaultWindow, [])
  const [startAt, setStartAt] = useState(defaults.startAt)
  const [endAt, setEndAt] = useState(defaults.endAt)
  const [selected, setSelected] = useState<string[]>([])
  const [useAll, setUseAll] = useState(true)
  const [hydrated, setHydrated] = useState(false)

  const scheduleQuery = useQuery({
    queryKey: ['audition-vote-schedule', auditionId],
    queryFn: () => getVoteSchedule(auditionId),
    enabled: !!auditionId,
    retry: false,
  })

  useEffect(() => {
    const s = scheduleQuery.data
    if (!s || hydrated) return
    if (s.voteStartAt) setStartAt(toLocalInput(s.voteStartAt))
    if (s.voteEndAt) setEndAt(toLocalInput(s.voteEndAt))
    if (s.candidateApplicationIds.length > 0) {
      setSelected(s.candidateApplicationIds)
      setUseAll(false)
    }
    setHydrated(true)
  }, [scheduleQuery.data, hydrated])

  const startMutation = useMutation({
    mutationFn: () =>
      startAuditionVote(auditionId, {
        startAt: toIso(startAt),
        endAt: toIso(endAt),
        applicationIds: useAll ? [] : selected,
      }),
    onSuccess: () => {
      toast.success(COPY.success)
      void queryClient.invalidateQueries({ queryKey: ['audition-vote-schedule', auditionId] })
      void queryClient.invalidateQueries({ queryKey: ['audition', auditionId] })
      void queryClient.invalidateQueries({ queryKey: ['audition-ranking', auditionId] })
    },
    onError: (e) => {
      const status = isAxiosError(e) ? e.response?.status : undefined
      const msg = isAxiosError(e) ? (e.response?.data as { message?: string } | undefined)?.message : undefined
      if (status === 409) {
        toast.error(msg || COPY.alreadyStarted)
        return
      }
      toast.error(msg || COPY.loadFailed)
    },
  })

  const s = scheduleQuery.data
  const locked = s?.voteStatus === 'OPEN' || s?.voteStatus === 'CLOSED'
  const names = new Map(applicants.map((a) => [a.applicationId, a.name]))
  const ids = s?.candidateApplicationIds?.length
    ? s.candidateApplicationIds
    : applicants.map((a) => a.applicationId)

  if (scheduleQuery.isError) {
    const forbidden = isAxiosError(scheduleQuery.error) && scheduleQuery.error.response?.status === 403
    const conflict = isAxiosError(scheduleQuery.error) && scheduleQuery.error.response?.status === 409
    if (forbidden) return null
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-4" data-testid="vote-start-panel">
        <p className="text-sm text-red-600">{conflict ? COPY.notThisRound : COPY.loadFailed}</p>
      </section>
    )
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4" data-testid="vote-start-panel">
      <h2 className="text-sm font-semibold text-gray-900">{COPY.title}</h2>
      <p className="mt-1 text-xs leading-5 text-gray-500">{COPY.hint}</p>
      {s ? (
        <p className="mt-2 text-sm text-gray-800">
          상태: {COPY.status[s.voteStatus] ?? s.voteStatus}
          {s.candidateCount ? ` · ${COPY.candidateCount(s.candidateCount)}` : ''}
          {s.roundNumber ? ` · ${s.roundNumber}차` : ''}
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm text-gray-800">
          <span className="font-medium">{COPY.startAt}</span>
          <input
            type="datetime-local"
            value={startAt}
            disabled={locked || startMutation.isPending}
            onChange={(e) => setStartAt(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm disabled:bg-gray-50"
            data-testid="vote-start-at"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-800">
          <span className="font-medium">{COPY.endAt}</span>
          <input
            type="datetime-local"
            value={endAt}
            disabled={locked || startMutation.isPending}
            onChange={(e) => setEndAt(e.target.value)}
            className="h-10 rounded-lg border border-gray-300 bg-white px-2 text-sm disabled:bg-gray-50"
            data-testid="vote-end-at"
          />
        </label>
      </div>

      <fieldset className="mt-3" disabled={locked || startMutation.isPending}>
        <legend className="text-sm font-medium text-gray-800">{COPY.candidates}</legend>
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-800">
          <input type="checkbox" checked={useAll} onChange={(e) => setUseAll(e.target.checked)} />
          {COPY.allCandidates}
        </label>
        {!useAll ? (
          <ul className="mt-2 flex flex-col gap-1">
            {ids.map((id) => (
              <li key={id}>
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={selected.includes(id)}
                    onChange={(e) =>
                      setSelected((cur) => (e.target.checked ? [...cur, id] : cur.filter((x) => x !== id)))
                    }
                  />
                  {names.get(id) || id}
                </label>
              </li>
            ))}
          </ul>
        ) : null}
        {locked ? <p className="mt-2 text-xs text-gray-500">{COPY.locked}</p> : null}
        {!locked && !useAll && selected.length === 0 && ids.length === 0 ? (
          <p className="mt-2 text-xs text-red-600">{COPY.needCandidates}</p>
        ) : null}
      </fieldset>

      <div className="mt-4 flex flex-wrap gap-2">
        {!locked ? (
          <button
            type="button"
            data-testid="vote-start-submit"
            disabled={startMutation.isPending || !startAt || !endAt}
            onClick={() => startMutation.mutate()}
            className="inline-flex min-h-11 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {startMutation.isPending ? COPY.saving : COPY.startAction}
          </button>
        ) : null}
        {s && (s.voteStatus === 'OPEN' || s.voteStatus === 'CLOSED') ? (
          <Link
            href={`/auditions/${auditionId}/ranking`}
            className="inline-flex min-h-11 items-center rounded-lg border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-800 no-underline hover:bg-violet-100"
          >
            {COPY.results}
          </Link>
        ) : null}
      </div>
    </section>
  )
}
