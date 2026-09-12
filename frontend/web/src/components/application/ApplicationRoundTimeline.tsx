'use client'

import { useQueries } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { meApplicationRoundsApi } from '@/shared/api/meApplicationRounds'
import type { AuditionRoundSummary } from '@/shared/audition/roundNav'
import { CARD_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

type Props = {
  applicationId: string
  roundSummaries: AuditionRoundSummary[]
  currentRoundNumber: number
}

function statusLine(
  status: string | null | undefined,
  roundNumber: number,
  currentRoundNumber: number,
  t: (key: 'roundDone' | 'roundFail' | 'roundInProgress' | 'roundSkipped' | 'roundWaitingUnsubmitted' | 'roundWaiting') => string,
): string {
  const s = status ?? '—'
  if (roundNumber === currentRoundNumber) {
    if (s === 'PASSED') return `✔ ${t('roundDone')}`
    if (s === 'FAILED') return `✖ ${t('roundFail')}`
    return `▶ ${t('roundInProgress')}`
  }
  if (s === 'PASSED') return `✔ ${t('roundDone')}`
  if (s === 'FAILED') return `✖ ${t('roundFail')}`
  if (s === 'SKIPPED') return `⊘ ${t('roundSkipped')}`
  if (roundNumber < currentRoundNumber) return t('roundWaitingUnsubmitted')
  return t('roundWaiting')
}

export function ApplicationRoundTimeline({ applicationId, roundSummaries, currentRoundNumber }: Props) {
  const t = useTranslations('application')
  const sorted = [...roundSummaries].sort((a, b) => a.roundNumber - b.roundNumber).filter((r) => r.roundId?.trim())

  const queries = useQueries({
    queries: sorted.map((r) => ({
      queryKey: ['me-round-eligibility', applicationId, r.roundId],
      queryFn: () => meApplicationRoundsApi.getEligibility(applicationId, r.roundId),
      enabled: !!applicationId && !!r.roundId?.trim(),
      staleTime: 30_000,
    })),
  })

  if (sorted.length === 0) {
    return null
  }

  return (
    <div className={CARD_BASE}>
      <h2 className={`${TITLE_PAGE} mb-2`}>{t('roundProgress')}</h2>
      <p className={`${TEXT_SUB} mb-4`}>{t('roundProgressHint')}</p>
      <ol className="flex flex-col gap-0 border-l-2 border-violet-200 pl-4">
        {sorted.map((r, i) => {
          const q = queries[i]
          const st = q.data?.submissionStatus ?? null
          const isCurrent = r.roundNumber === currentRoundNumber
          const statusText = q.isSuccess ? statusLine(st, r.roundNumber, currentRoundNumber, t) : '…'
          return (
            <li
              key={r.roundId}
              className={`relative pb-4 pl-2 before:absolute before:left-[-21px] before:top-1.5 before:h-3 before:w-3 before:rounded-full ${
                isCurrent ? 'before:bg-violet-600' : 'before:bg-gray-300'
              } last:pb-0`}
            >
              <div className={`text-sm font-semibold ${isCurrent ? 'text-violet-800' : 'text-gray-800'}`}>
                {t('roundLine', { n: r.roundNumber, line: statusText })}
              </div>
              {q.isSuccess && st ? (
                <div className={`${TEXT_SUB} mt-0.5 text-xs`}>{t('statusColon', { status: st })}</div>
              ) : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
