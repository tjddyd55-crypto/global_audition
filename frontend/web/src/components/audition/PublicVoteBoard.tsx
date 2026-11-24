'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { auditionApi, type PublicVoteItem } from '@/shared/api/auditions'
import { useAuthStore } from '@/shared/auth/authStore'
import { Link, useRouter } from '@/i18n.config'
import { HERO } from '@/shared/design-tokens'
import { CARD_BASE, PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'
import { recruitFieldLabel } from '@/shared/audition/recruitFields'
import { formatCount } from '@/shared/money/currency'
import { VoteShareSheet } from '@/components/vote/VoteShareSheet'
import { SharedCandidateLanding } from '@/components/vote/SharedCandidateLanding'
import { VoteInlineVideo } from '@/components/vote/VoteInlineVideo'
import { voteSharePath } from '@/shared/vote/voteShare'
import { canShowPublicVoteCount, remainingMessage, voteRemaining } from '@/shared/vote/voteRemaining'
import { voteLabelKey } from '@/shared/vote/voteLabels'

type Props = {
  auditionId: string
  auditionTitleFallback: string
  /** 공유 링크에 고정된 회차 */
  shareRound?: number | null
  /** 공유 링크의 후보(지원 ID). 유효하면 해당 후보만 보여 준다. */
  shareCandidate?: string | null
}

export function PublicVoteBoard({ auditionId, auditionTitleFallback, shareRound, shareCandidate }: Props) {
  const t = useTranslations('vote')
  const ts = useTranslations('voteShare')
  const tField = useTranslations('recruitField')
  const locale = useLocale()
  const queryClient = useQueryClient()
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [shareItem, setShareItem] = useState<PublicVoteItem | null>(null)
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])


  const qk = ['audition-votes', auditionId, shareRound ?? null, shareCandidate ?? null] as const

  const votesQuery = useQuery({
    queryKey: qk,
    queryFn: () => auditionApi.listVotes(auditionId, undefined, { round: shareRound, candidate: shareCandidate }),
    enabled: !!auditionId,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['audition-votes', auditionId] })
    queryClient.invalidateQueries({ queryKey: ['audition-ranking', auditionId] })
    queryClient.invalidateQueries({ queryKey: ['audition-manage', auditionId] })
  }, [queryClient, auditionId])

  const openVideoWithViewBump = useCallback(
    (item: PublicVoteItem) => {
      setPlayingId(item.applicationId)
      if (typeof window === 'undefined') return
      const k = `audition-view-${auditionId}-${item.applicationId}`
      if (sessionStorage.getItem(k)) return
      sessionStorage.setItem(k, '1')
      void auditionApi
        .bumpApplicationView(item.applicationId)
        .then(() => {
          invalidate()
        })
        .catch(() => {
          sessionStorage.removeItem(k)
        })
    },
    [auditionId, invalidate]
  )

  // 연타·중복 클릭으로 요청이 겹치지 않게 한다(isPending 은 다음 렌더에서야 바뀐다).
  const castInFlight = useRef(false)
  const castMutation = useMutation({
    mutationFn: async ({ applicationId }: { applicationId: string; name?: string }) => {
      if (castInFlight.current) throw new Error('VOTE_IN_FLIGHT')
      castInFlight.current = true
      try {
        return await auditionApi.vote(auditionId, applicationId)
      } finally {
        castInFlight.current = false
      }
    },
    onSuccess: (res, vars) => {
      invalidate()
      toast.success(
        res.replaced ? t('changed') : vars.name ? ts('votedFor', { name: vars.name }) : t('castSuccess')
      )
    },
    onError: (e) => {
      if ((e as Error)?.message === 'VOTE_IN_FLIGHT') return
      toast.error(t('failed'))
    },
  })

  const removeMutation = useMutation({
    mutationFn: (applicationId: string) => auditionApi.cancelVote(applicationId),
    onSuccess: () => {
      invalidate()
      toast.success(t('cancelSuccess'))
    },
    onError: () => toast.error(t('cancelFailed')),
  })

  const requireAuth = useCallback(() => {
    if (!accessToken) {
      // 로그인·가입 후 같은 후보 화면으로 돌아온다. 돌아와도 자동 투표는 하지 않는다.
      const back = shareCandidate && shareRound
        ? voteSharePath(auditionId, shareRound, shareCandidate)
        : `/auditions/${auditionId}/vote`
      router.push(`/login?next=${encodeURIComponent(back)}`)
      return false
    }
    return true
  }, [accessToken, router, auditionId, shareCandidate, shareRound])

  const voteMutationBusy = castMutation.isPending || removeMutation.isPending

  if (votesQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-sm text-gray-600" data-testid="vote-loading">
        {t('loading')}
      </div>
    )
  }

  if (votesQuery.isError) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-12 text-center" data-testid="vote-load-error">
        <p className="text-sm text-red-600">{t('loadBoardFailed')}</p>
        <button type="button" onClick={() => void votesQuery.refetch()} className="min-h-11 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-gray-900">
          {ts('retry')}
        </button>
      </div>
    )
  }

  const p = votesQuery.data
  const formatWhen = (iso?: string | null) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(d)
  }
  const planOff = p && p.votingPlanEnabled === false
  const phase = p?.voteStatus
  const showClosedResults = Boolean(p && phase === 'CLOSED' && (p.items?.length ?? 0) > 0)
  const shared = p?.sharedCandidate ?? null
  if (p && !p.votingEnabled && !showClosedResults && !shared) {
    const message = planOff
      ? t('disabledRound')
      : phase === 'SCHEDULED'
        ? t('scheduled', { start: formatWhen(p.voteStartAt) })
        : phase === 'CLOSED'
          ? t('closedResults')
          : t('notStarted')
    return (
      <div className={`${PAGE_CONTAINER} py-12 text-center`} data-testid="vote-disabled">
        <p className="text-sm text-neutral-600">{message}</p>
        {phase === 'CLOSED' || phase === 'OPEN' ? (
          <Link href={`/auditions/${auditionId}/ranking`} className="mt-4 mr-3 inline-block text-sm font-medium text-violet-700 no-underline">
            {t('viewResults')}
          </Link>
        ) : null}
        <Link href={`/auditions/${auditionId}`} className="mt-4 inline-block text-sm font-medium text-violet-700 no-underline">
          ← {t('backToAudition')}
        </Link>
      </div>
    )
  }
  const audition = p?.audition
  const summary = p?.summary
  const items = p?.items ?? []
  const title = audition?.title || auditionTitleFallback
  const canCast = Boolean(p?.votingEnabled)
  const linkRound = p?.roundNumber ?? 1
  const shareUrlFor = (item: PublicVoteItem) =>
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/${locale}${voteSharePath(auditionId, linkRound, item.applicationId)}`
  const remain = remainingMessage(voteRemaining(p?.voteEndAt, now), (key, values) => ts(key as 'remainingDays', values))
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
  const ownVotesText = (n: number) =>
    ts(voteLabelKey(n, locale, 'ownVotes', 'ownVotesOne') as 'ownVotes', { n: formatCount(n, locale) })
  const windowNotice = canCast
    ? null
    : phase === 'SCHEDULED'
      ? t('scheduled', { start: formatWhen(p?.voteStartAt) })
      : phase === 'CLOSED'
        ? t('closedResults')
        : planOff
          ? t('disabledRound')
          : t('notStarted')
  const sharedName = shared ? shared.userName || t('nameUnset') : ''
  const sharedVoted = Boolean(shared && canCast && p?.myVoteApplicationId === shared.applicationId)

  // 유효한 공유 링크면 해당 후보만 보여 준다. 잘못된 후보 파라미터는 shared 가 없어 전체 화면으로 넘어간다.
  if (shared && p) {
    return (
      <>
        <SharedCandidateLanding
          auditionId={auditionId}
          page={p}
          shared={shared}
          canCast={canCast}
          voted={sharedVoted}
          isGuest={!accessToken}
          voteBusy={voteMutationBusy}
          windowNotice={windowNotice}
          otherRound={Boolean(p.voteRoundNumber && p.roundNumber !== p.voteRoundNumber)}
          onVote={() => {
            if (!requireAuth()) return
            castMutation.mutate({ applicationId: shared.applicationId, name: sharedName })
          }}
          onShare={() => setShareItem(shared)}
        />
        {shareItem ? (
          <VoteShareSheet
            open
            onClose={() => setShareItem(null)}
            url={shareUrlFor(shareItem)}
            title={ts('shareTitle', { name: shareItem.userName || t('nameUnset') })}
            defaultText={ts('candidateText', { name: shareItem.userName || t('nameUnset') })}
          />
        ) : null}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* Hero */}
      <div
        className="border-b border-violet-100"
        style={{
          background: `linear-gradient(135deg, ${HERO.primaryGradientStart}22, ${HERO.primaryGradientEnd}18, #fff)`,
          paddingTop: 28,
          paddingBottom: 32,
        }}
      >
        <div className={PAGE_CONTAINER}>
          <Link href={`/auditions/${auditionId}`} className="text-sm font-medium text-violet-700 no-underline hover:underline">
            ← {t('backToAudition')}
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 md:text-3xl">{title}</h1>
          <p className="mt-3 text-sm font-medium text-gray-800" data-testid="vote-status-line">
            {statusLine}
            {phase === 'OPEN' && p?.voteEndAt ? ` · ${ts('endsAt', { end: formatWhen(p.voteEndAt) })}` : null}
          </p>
          {phase === 'SCHEDULED' && p?.voteStartAt ? (
            <p className="mt-1 text-sm text-gray-600">{ts('startsAt', { start: formatWhen(p.voteStartAt) })}</p>
          ) : null}
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600">
            <span>{t('applicantCount', { n: formatCount(audition?.applicantCount ?? summary?.applicantCount ?? 0, locale) })}</span>
            <span>{t('totalVotes', { n: formatCount(audition?.totalVotes ?? summary?.totalVotes ?? 0, locale) })}</span>
          </div>
        </div>
      </div>

      <div className={`${PAGE_CONTAINER} mt-6 flex flex-col gap-6`}>
        {p?.voteRoundNumber && p.roundNumber !== p.voteRoundNumber ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800" data-testid="vote-other-round">
            {ts('otherRound', { round: p.roundNumber })}
          </p>
        ) : null}
        {/* 요약 카드 4개 */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard label={t('applicantFallback')} value={summary?.applicantCount ?? 0} locale={locale} />
          <SummaryCard label={t('votes')} value={summary?.totalVotes ?? 0} locale={locale} />
          <SummaryCard label={t('totalViews')} value={summary?.totalViewCount ?? 0} locale={locale} />
          <SummaryCard label={t('myVotes')} value={summary?.myVoteCount ?? 0} locale={locale} />
        </div>

        {/* 그리드 */}
        {windowNotice && items.length > 0 ? (
          <p className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">{windowNotice}</p>
        ) : null}
        {items.length === 0 ? (
          <p className={`${TEXT_SUB} text-center`}>{t('emptyApplicants')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const name = item.userName || t('nameUnset')
              return (
              <article
                key={item.applicationId}
                className={`overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm${item.isVoted ? ' ring-2 ring-violet-400' : ''}`}
                data-application-id={item.applicationId}
              >
                <VoteInlineVideo
                  videoUrl={item.videoUrl}
                  thumbnailUrl={item.thumbnailUrl}
                  title={t('applicantVideo', { name })}
                  playing={playingId === item.applicationId}
                  onPlay={() => openVideoWithViewBump(item)}
                  compact
                />
                <div className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-extrabold text-gray-900">{name}</h2>
                      {item.category ? (
                        <p className="mt-0.5 truncate text-xs font-medium text-gray-600">{recruitFieldLabel(item.category, tField)}</p>
                      ) : null}
                    </div>
                    {canShowPublicVoteCount(phase) ? (
                      <p className="shrink-0 text-lg font-extrabold text-violet-700" data-testid="vote-own-count">
                        {ownVotesText(item.voteCount)}
                      </p>
                    ) : null}
                  </div>
                  <div className={`mt-3 grid gap-2 ${canCast ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {canCast && item.isVoted ? (
                      <button
                        type="button"
                        disabled={voteMutationBusy}
                        onClick={() => {
                          if (!requireAuth()) return
                          removeMutation.mutate(item.applicationId)
                        }}
                        className="min-h-11 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {t('cancelVote')}
                      </button>
                    ) : canCast ? (
                      <button
                        type="button"
                        disabled={voteMutationBusy}
                        onClick={() => {
                          if (!requireAuth()) return
                          castMutation.mutate({ applicationId: item.applicationId, name: item.userName || undefined })
                        }}
                        className="min-h-11 rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 px-3 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                      >
                        {t('voteAction')}
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setShareItem(item)}
                      className="min-h-11 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                      data-testid="vote-card-share"
                    >
                      {ts('share')}
                    </button>
                  </div>
                </div>
              </article>
              )
            })}
          </div>
        )}
      </div>

      {shareItem ? (
        <VoteShareSheet
          open
          onClose={() => setShareItem(null)}
          url={shareUrlFor(shareItem)}
          title={ts('shareTitle', { name: shareItem.userName || t('nameUnset') })}
          defaultText={ts('candidateText', { name: shareItem.userName || t('nameUnset') })}
        />
      ) : null}
    </div>
  )
}

function SummaryCard({ label, value, locale }: { label: string; value: number; locale: string }) {
  return (
    <div className={CARD_BASE + ' text-center'}>
      <div className="text-xl font-bold text-violet-600">{formatCount(value, locale)}</div>
      <div className={TEXT_SUB}>{label}</div>
    </div>
  )
}
