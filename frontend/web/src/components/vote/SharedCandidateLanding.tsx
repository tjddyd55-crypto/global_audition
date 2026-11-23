'use client'

import { useEffect, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import type { PublicVoteItem, PublicVotesPagePayload } from '@/shared/api/auditions'
import { auditionApi } from '@/shared/api/auditions'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { getVideoEmbedSrc, isYoutubeShortsLikeUrl } from '@/shared/utils/videoEmbed'
import { recruitFieldLabel } from '@/shared/audition/recruitFields'
import { formatCount } from '@/shared/money/currency'
import { Link } from '@/i18n.config'
import { PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'
import { voteBoardPath } from '@/shared/vote/voteShare'
import { canShowPublicVoteCount, remainingMessage, voteRemaining } from '@/shared/vote/voteRemaining'

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
  const embed = getVideoEmbedSrc(shared.videoUrl)
  const shorts = isYoutubeShortsLikeUrl(shared.videoUrl)
  const thumb = resolveVideoThumbnailUrl(shared.videoUrl, shared.thumbnailUrl)
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

        {otherRound ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" data-testid="vote-other-round">
            {ts('otherRound', { round: page.roundNumber })}
          </p>
        ) : null}

        <section className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-violet-100" data-testid="vote-shared-candidate" data-application-id={shared.applicationId}>
          <div className={`relative w-full bg-black ${shorts ? 'mx-auto aspect-[9/16] max-h-[70vh] max-w-sm' : 'aspect-video'}`}>
            {embed ? (
              <iframe
                src={embed}
                title={t('applicantVideo', { name })}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            ) : thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-white/70">{t('emptyApplicants')}</div>
            )}
          </div>

          <div className="px-5 pb-6 pt-5">
            <h1 className="text-3xl font-extrabold leading-tight text-gray-900">{name}</h1>
            {shared.category ? (
              <p className="mt-1 text-sm font-medium text-gray-700">{recruitFieldLabel(shared.category, tField)}</p>
            ) : null}
            {shared.description?.trim() ? <p className={`${TEXT_SUB} mt-3 text-base leading-relaxed`}>{shared.description}</p> : null}

            {showCount ? (
              <p className="mt-5 text-3xl font-extrabold tracking-tight text-violet-700" data-testid="vote-own-count">
                {ts('ownVotes', { n: formatCount(shared.voteCount, locale) })}
              </p>
            ) : null}

            <p className="mt-2 text-sm font-medium text-gray-800" data-testid="vote-status-line">
              {statusLine}
              {phase === 'OPEN' && page.voteEndAt ? ` · ${ts('endsAt', { end: formatWhen(page.voteEndAt, locale) })}` : null}
            </p>
            {phase === 'SCHEDULED' && page.voteStartAt ? (
              <p className="mt-1 text-sm text-gray-600">{ts('startsAt', { start: formatWhen(page.voteStartAt, locale) })}</p>
            ) : null}

            {windowNotice ? (
              <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700" data-testid="vote-window-notice">
                {windowNotice}
              </p>
            ) : null}

            {voted ? (
              <div className="mt-5 rounded-xl bg-violet-50 px-4 py-3" data-testid="vote-voted-banner">
                <p className="font-semibold text-violet-800">{ts('votedFor', { name })}</p>
                <p className="mt-1 text-sm text-violet-700">{ts('shareAgain')}</p>
              </div>
            ) : isGuest && canCast ? (
              <p className="mt-5 text-sm text-gray-600" data-testid="vote-login-hint">
                {ts('loginToVote')}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                data-testid="vote-shared-cast"
                disabled={!canCast || voteBusy || voted}
                onClick={onPrimary}
                className="min-h-12 w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-3 text-base font-semibold text-white hover:opacity-95 disabled:opacity-50"
              >
                {voteLabel}
              </button>
              <button
                type="button"
                onClick={onShare}
                className={`min-h-12 w-full rounded-xl border px-4 py-3 text-base font-semibold hover:bg-gray-50 ${
                  voted ? 'border-violet-300 bg-white text-violet-800' : 'border-[#E5E7EB] bg-white text-gray-900'
                }`}
                data-testid="vote-shared-share"
              >
                {voted ? ts('shareAgain') : ts('share')}
              </button>
              <Link
                href={voteBoardPath(auditionId, linkRound)}
                className="flex min-h-11 items-center justify-center text-sm font-semibold text-violet-700 no-underline hover:underline"
                data-testid="vote-view-all"
              >
                {ts('viewAll')}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
