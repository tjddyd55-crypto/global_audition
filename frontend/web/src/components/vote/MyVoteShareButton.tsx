'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { getMyVoteShare } from '@/shared/api/auditions/votes'
import { voteSharePath } from '@/shared/vote/voteShare'
import { VoteShareSheet } from './VoteShareSheet'
import { BTN_PRIMARY } from '@/shared/ui/specClasses'

/** 지원자 본인 '내 투표 공유하기'. 공개 투표 확정 후보일 때만 보인다. */
export function MyVoteShareButton({ applicationId }: { applicationId: string }) {
  const ts = useTranslations('voteShare')
  const tv = useTranslations('vote')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const q = useQuery({
    queryKey: ['my-vote-share', applicationId],
    queryFn: () => getMyVoteShare(applicationId),
    enabled: !!applicationId,
    retry: false,
  })
  const s = q.data
  if (!s?.candidate || !s.auditionId || !s.roundNumber) return null
  const when = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso)) : ''
  const status =
    s.voteStatus === 'OPEN' ? tv('statusOpen') : s.voteStatus === 'SCHEDULED' ? tv('statusScheduled') : tv('statusClosed')
  const url =
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/${locale}${voteSharePath(s.auditionId, s.roundNumber, applicationId)}`
  const info = (
    <div className="flex flex-col gap-0.5" data-testid="my-vote-share-info">
      {s.candidateNumber ? <span>{tv('candidateNumber', { n: s.candidateNumber })}</span> : null}
      <span>{ts('roundLabel', { round: s.roundNumber })}</span>
      <span>{ts('status', { status })}</span>
      {s.voteStatus === 'SCHEDULED' && s.voteStartAt ? <span>{ts('startsAt', { start: when(s.voteStartAt) })}</span> : null}
      {s.voteEndAt ? <span>{ts('endsAt', { end: when(s.voteEndAt) })}</span> : null}
    </div>
  )
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm text-gray-700">{info}</div>
      <button type="button" className={BTN_PRIMARY} onClick={() => setOpen(true)} data-testid="my-vote-share">
        {ts('myShare')}
      </button>
      <VoteShareSheet
        open={open}
        onClose={() => setOpen(false)}
        url={url}
        title={ts('myShare')}
        defaultText={ts(s.candidateNumber ? 'numberedMyShareText' : 'myShareText', { number: s.candidateNumber ?? 0, round: s.roundNumber })}
        editable
        info={info}
      />
    </div>
  )
}
