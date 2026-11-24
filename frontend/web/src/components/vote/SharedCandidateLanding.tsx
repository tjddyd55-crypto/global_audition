'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { PublicVoteItem, PublicVotesPagePayload } from '@/shared/api/auditions'
import { auditionApi } from '@/shared/api/auditions'
import { recruitFieldLabel } from '@/shared/audition/recruitFields'
import { formatCount } from '@/shared/money/currency'
import { Link } from '@/i18n.config'
import { PAGE_CONTAINER } from '@/shared/ui/specClasses'
import { VoteInlineVideo } from '@/components/vote/VoteInlineVideo'
import { voteBoardPath } from '@/shared/vote/voteShare'
import { canShowPublicVoteCount, remainingMessage, voteRemaining } from '@/shared/vote/voteRemaining'
import { voteLabelKey } from '@/shared/vote/voteLabels'

type Props = {
  auditionId: string
  page: PublicVotesPagePayload
  shared: PublicVoteItem
  canCast: boolean
  voted: boolean
  isGuest: boolean
  voteBusy: boolean
  windowNotice: string | null
  otherRound: boolean
  onVote: () => void
  onShare: () => void
}

function formatWhen(iso: string | null | undefined, locale: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
}

/**
 * 공유 링크 전용 화면: 해당 후보의 영상·소개·득표만 보여 준다.
 * 전체 명단·집계·카테고리는 넣지 않는다.
 */
export function SharedCandidateLanding({
  auditionId,
  page,
  shared,
  canCast,
  voted,
  isGuest,
  voteBusy,
  windowNotice,
  otherRound,
  onVote,
  onShare,
}: Props) {
  const t = useTranslations('vote')
  const ts = useTranslations('voteShare')
  const tField = useTranslations('recruitField')
  const locale = useLocale()
  const [now, setNow] = useState(() => new Date())
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || !shared.applicationId) return
    const k = `audition-view-${auditionId}-${shared.applicationId}`
    if (sessionStorage.getItem(k)) return
    sessionStorage.setItem(k, '1')
    void auditionApi.bumpApplicationView(shared.applicationId).catch(() => sessionStorage.removeItem(k))
  }, [auditionId, shared.applicationId])

  const name = shared.userName || t('nameUnset')
  const linkRound = page.roundNumber ?? 1
  const phase = page.voteStatus
  const showCount = canShowPublicVoteCount(phase)
  const remain = remainingMessage(voteRemaining(page.voteEndAt, now), (key, values) => ts(key, values))
  const statusLine =
    phase === 'OPEN' && remain
      ? ts('openWithRemaining', { remaining: remain })
      : phase === 'OPEN'
        ? t('statusOpen')
        : phase === 'SCHEDULED'
          ? t('statusScheduled')
          : phase === 'CLOSED'
            ? t('statusClosed')
            : t('notStarted')

  const voteLabel = voted ? ts('alreadyVoted') : isGuest && canCast ? ts('loginAndVote') : ts('voteFor', { name })

  const onPrimary = () => {
    if (!canCast || voteBusy || voted) return
    if (isGuest) toast.message(ts('loginToVote'))
    onVote()
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12" data-testid="vote-share-landing">
      <div className={`${PAGE_CONTAINER} max-w-2xl py-4`}>
        <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 no-underline hover:underline">
          ← {t('backToAudition')}
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-violet-700">
          {ts('roundLabel', { round: linkRound })}
        </p>
        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{page.audition.title}</p>
        <p className="mt-2 text-sm font-medium text-gray-800" data-testid="vote-status-line">
          {statusLine}
          {phase === 'OPEN' && page.voteEndAt ? ` · ${ts('endsAt', { end: formatWhen(page.voteEndAt, locale) })}` : null}
        </p>
        {phase === 'SCHEDULED' && page.voteStartAt ? (
          <p className="mt-1 text-sm text-gray-600">{ts('startsAt', { start: formatWhen(page.voteStartAt, locale) })}</p>
        ) : null}
        {otherRound ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" data-testid="vote-other-round">
            {ts('otherRound', { round: page.roundNumber })}
          </p>
        ) : null}
        {windowNotice ? (
          <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700" data-testid="vote-window-notice">
            {windowNotice}
          </p>
        ) : null}

        <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-violet-100" data-testid="vote-shared-candidate" data-application-id={shared.applicationId}>
          <VoteInlineVideo
            videoUrl={shared.videoUrl}
            thumbnailUrl={shared.thumbnailUrl}
            title={t('applicantVideo', { name })}
            playing={playing}
            onPlay={() => setPlaying(true)}
          />

          <div className="px-4 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold leading-tight text-gray-900">{name}</h1>
                {shared.category ? (
                  <p className="mt-0.5 truncate text-sm font-medium text-gray-600">{recruitFieldLabel(shared.category, tField)}</p>
                ) : null}
              </div>
              {showCount ? (
                <p className="shrink-0 text-2xl font-extrabold tracking-tight text-violet-700" data-testid="vote-own-count">
                  {ts(voteLabelKey(shared.voteCount, locale, 'ownVotes', 'ownVotesOne') as 'ownVotes', { n: formatCount(shared.voteCount, locale) })}
                </p>
              ) : null}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                data-testid="vote-shared-cast"
                disabled={!canCast || voteBusy || voted}
                onClick={onPrimary}
                className="min-h-12 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-3 py-3 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
              >
                {voteLabel}
              </button>
              <button
                type="button"
                onClick={onShare}
                className={`min-h-12 rounded-xl border px-3 py-3 text-sm font-semibold hover:bg-gray-50 ${
                  voted ? 'border-violet-300 bg-white text-violet-800' : 'border-[#E5E7EB] bg-white text-gray-900'
                }`}
                data-testid="vote-shared-share"
              >
                {ts('share')}
              </button>
            </div>
            <Link
              href={voteBoardPath(auditionId, linkRound)}
              className="mt-2 flex min-h-11 items-center justify-center text-sm font-semibold text-violet-700 no-underline hover:underline"
              data-testid="vote-view-all"
            >
              {ts('viewAll')}
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
