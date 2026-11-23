'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { auditionApi, type PublicVoteItem } from '@/shared/api/auditions'
import { VideoEmbedOverlay } from '@/components/video/VideoEmbedOverlay'
import { resolveVideoThumbnailUrl } from '@/shared/audition/videoThumbnail'
import { getVideoEmbedSrc } from '@/shared/utils/videoEmbed'
import { useAuthStore } from '@/shared/auth/authStore'
import { Link, useRouter } from '@/i18n.config'
import { HERO } from '@/shared/design-tokens'
import { CARD_BASE, PAGE_CONTAINER, TEXT_SUB } from '@/shared/ui/specClasses'
import { isAllCategoryName } from '@/shared/audition/allCategorySentinel'
import { recruitFieldLabel } from '@/shared/audition/recruitFields'
import { formatCount } from '@/shared/money/currency'
import { VoteShareSheet } from '@/components/vote/VoteShareSheet'
import { voteSharePath } from '@/shared/vote/voteShare'

type Props = {
  auditionId: string
  auditionTitleFallback: string
  /** 공유 링크에 고정된 회차 */
  shareRound?: number | null
  /** 공유 링크의 후보(지원 ID). 표시 순서만 바꾸고 순위는 그대로 */
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
  const [category, setCategory] = useState<string | null>(null)
  const [playItem, setPlayItem] = useState<PublicVoteItem | null>(null)
  const [shareItem, setShareItem] = useState<PublicVoteItem | null>(null)
  const allLabel = t('allCategories')

  const qk = ['audition-votes', auditionId, category ?? allLabel, shareRound ?? null, shareCandidate ?? null] as const

  const votesQuery = useQuery({
    queryKey: qk,
    queryFn: () => auditionApi.listVotes(auditionId, category, { round: shareRound, candidate: shareCandidate }),
    enabled: !!auditionId,
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['audition-votes', auditionId] })
    queryClient.invalidateQueries({ queryKey: ['audition-ranking', auditionId] })
    queryClient.invalidateQueries({ queryKey: ['audition-manage', auditionId] })
  }, [queryClient, auditionId])

  const openVideoWithViewBump = useCallback(
    (item: PublicVoteItem) => {
      setPlayItem(item)
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

  const castMutation = useMutation({
    mutationFn: ({ applicationId }: { applicationId: string; name?: string }) =>
      auditionApi.vote(auditionId, applicationId),
    onSuccess: (res, vars) => {
      invalidate()
      toast.success(
        res.replaced ? t('changed') : vars.name ? ts('votedFor', { name: vars.name }) : t('castSuccess')
      )
    },
    onError: () => toast.error(t('failed')),
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
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">{t('loading')}</div>
    )
  }

  if (votesQuery.isError) {
    return <div className="py-12 text-center text-sm text-red-600">{t('loadBoardFailed')}</div>
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
  const subCopy = phase === 'CLOSED' ? t('closedResults') : t('cheerHint')
  const linkRound = p?.roundNumber ?? 1
  const shareUrlFor = (item: PublicVoteItem) =>
    typeof window === 'undefined'
      ? ''
      : `${window.location.origin}/${locale}${voteSharePath(auditionId, linkRound, item.applicationId)}`
  const statusLabel =
    phase === 'OPEN' ? t('statusOpen') : phase === 'SCHEDULED' ? t('statusScheduled') : phase === 'CLOSED' ? t('statusClosed') : t('notStarted')
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
  const sharedThumb = shared ? resolveVideoThumbnailUrl(shared.videoUrl, shared.thumbnailUrl) : null
  const sharedVoted = Boolean(shared && canCast && p?.myVoteApplicationId === shared.applicationId)

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
          <p className={`${TEXT_SUB} mt-2 max-w-2xl text-base text-gray-700`}>{subCopy}</p>
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
        {shared ? (
          <section
            className="overflow-hidden rounded-2xl border-2 border-violet-300 bg-white shadow-md"
            data-testid="vote-shared-candidate"
            data-application-id={shared.applicationId}
          >
            <div
              className={`relative aspect-video bg-gray-900${getVideoEmbedSrc(shared.videoUrl) ? ' cursor-pointer' : ''}`}
              role={getVideoEmbedSrc(shared.videoUrl) ? 'button' : undefined}
              aria-label={getVideoEmbedSrc(shared.videoUrl) ? t('playVideo') : undefined}
              onClick={() => {
                if (getVideoEmbedSrc(shared.videoUrl)) openVideoWithViewBump(shared)
              }}
            >
              {sharedThumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sharedThumb} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-gray-800" />
              )}
              <span className="absolute left-3 top-3 rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white">
                {ts('sharedBadge')}
              </span>
              {getVideoEmbedSrc(shared.videoUrl) ? (
                <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-3xl text-white" aria-hidden>
                  ▶
                </div>
              ) : null}
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-violet-700">{ts('roundLabel', { round: linkRound })} · {statusLabel}</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">{sharedName}</h2>
              {shared.category ? (
                <p className="mt-1 text-sm font-medium text-gray-700">{recruitFieldLabel(shared.category, tField)}</p>
              ) : null}
              {shared.description?.trim() ? <p className={`${TEXT_SUB} mt-2 text-sm`}>{shared.description}</p> : null}
              {windowNotice ? (
                <p className="mt-3 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700" data-testid="vote-window-notice">{windowNotice}</p>
              ) : p?.voteEndAt ? (
                <p className="mt-3 text-sm text-gray-600">{ts('endsAt', { end: formatWhen(p.voteEndAt) })}</p>
              ) : null}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  data-testid="vote-shared-cast"
                  disabled={!canCast || voteMutationBusy || sharedVoted}
                  onClick={() => {
                    if (!requireAuth()) return
                    castMutation.mutate({ applicationId: shared.applicationId, name: sharedName })
                  }}
                  className="min-h-11 flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2 text-base font-semibold text-white hover:opacity-95 disabled:opacity-50"
                >
                  {sharedVoted ? ts('alreadyVoted') : ts('voteFor', { name: sharedName })}
                </button>
                <button
                  type="button"
                  onClick={() => setShareItem(shared)}
                  className="min-h-11 rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                  data-testid="vote-shared-share"
                >
                  {ts('share')}
                </button>
                <a
                  href="#vote-all-candidates"
                  className="flex min-h-11 items-center justify-center rounded-lg border border-violet-200 px-4 py-2 text-sm font-semibold text-violet-700 no-underline"
                >
                  {ts('viewAll')}
                </a>
              </div>
            </div>
          </section>
        ) : null}
        {/* 카테고리 탭 */}
        {audition?.categories && audition.categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {audition.categories.map((c) => (
              <button
                key={c.name}
                type="button"
                disabled={voteMutationBusy}
                onClick={() => setCategory(isAllCategoryName(c.name, allLabel) ? null : c.name)}
                className={
                  (isAllCategoryName(c.name, allLabel) && category === null) || c.name === category
                    ? 'min-h-11 whitespace-normal break-words rounded-full bg-violet-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60'
                    : 'min-h-11 whitespace-normal break-words rounded-full border border-[#E5E7EB] bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50'
                }
              >
                {isAllCategoryName(c.name) ? allLabel : recruitFieldLabel(c.name, tField)}
                {isAllCategoryName(c.name, allLabel) ? '' : ` ${c.count}`}
              </button>
            ))}
          </div>
        )}

        {/* 요약 카드 4개 */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard label={t('applicantFallback')} value={summary?.applicantCount ?? 0} locale={locale} />
          <SummaryCard label={t('votes')} value={summary?.totalVotes ?? 0} locale={locale} />
          <SummaryCard label={t('totalViews')} value={summary?.totalViewCount ?? 0} locale={locale} />
          <SummaryCard label={t('myVotes')} value={summary?.myVoteCount ?? 0} locale={locale} />
        </div>

        {/* 그리드 */}
        {!shared && windowNotice && items.length > 0 ? (
          <p className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700">{windowNotice}</p>
        ) : null}
        {items.length === 0 ? (
          shared ? null : <p className={`${TEXT_SUB} text-center`}>{t('emptyApplicants')}</p>
        ) : (
          <div id="vote-all-candidates" className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const cardThumb = resolveVideoThumbnailUrl(item.videoUrl, item.thumbnailUrl)
              const canEmbed = Boolean(getVideoEmbedSrc(item.videoUrl))
              const canOpenVideo = canEmbed && !voteMutationBusy
              return (
              <article key={item.applicationId} className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white shadow-sm">
                <div
                  className={`relative aspect-[16/10] bg-gray-900${canOpenVideo ? ' cursor-pointer' : ''}`}
                  role={canOpenVideo ? 'button' : undefined}
                  tabIndex={canOpenVideo ? 0 : undefined}
                  aria-label={canOpenVideo ? t('playVideo') : undefined}
                  onKeyDown={(e) => {
                    if (!canOpenVideo) return
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      openVideoWithViewBump(item)
                    }
                  }}
                  onClick={() => {
                    if (!canOpenVideo) return
                    openVideoWithViewBump(item)
                  }}
                >
                  {cardThumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cardThumb} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gray-800" />
                  )}
                  <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
                    👁 {formatCount(item.viewCount, locale)}
                  </span>
                  <div
                    className={`pointer-events-none absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-2xl text-white ${
                      canOpenVideo ? 'bg-black/50' : 'bg-black/35 opacity-40'
                    }`}
                    aria-hidden
                  >
                    ▶
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent" />
                  {item.category ? (
                    <span className="absolute bottom-3 left-2 rounded-md bg-violet-600/90 px-2 py-0.5 text-xs font-semibold text-white">
                      {item.category}
                    </span>
                  ) : null}
                </div>
                <div className="p-4">
                  <p className="text-base font-bold text-gray-900">{item.userName || t('nameUnset')}</p>
                  <p className={`${TEXT_SUB} mt-1 line-clamp-2 text-sm`}>
                    {/* 공개 화면: 이메일은 노출하지 않는다(서버도 비워서 보낸다). */}
                    {item.description?.trim() ? item.description : ''}
                  </p>
                  <div
                    className={`mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E5E7EB] pt-4 ${
                      item.isVoted ? 'ring-2 ring-violet-400 ring-offset-2 rounded-lg -mx-2 px-2 pb-2' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-800">
                      ♥ {formatCount(item.voteCount, locale)} <span className="text-gray-500">{t('votes')}</span>
                    </span>
                    {canCast && item.isVoted ? (
                      <button
                        type="button"
                        disabled={voteMutationBusy}
                        onClick={() => {
                          if (!requireAuth()) return
                          removeMutation.mutate(item.applicationId)
                        }}
                        className="rounded-lg border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50 disabled:opacity-50"
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
                        className="rounded-lg bg-gradient-to-r from-violet-600 to-pink-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
                      >
                        {t('voteAction')}
                      </button>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShareItem(item)}
                    className="mt-3 w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                    data-testid="vote-card-share"
                  >
                    {ts('share')}
                  </button>
                </div>
              </article>
              )
            })}
          </div>
        )}
      </div>

      <VideoEmbedOverlay
        play={
          playItem
            ? {
                url: playItem.videoUrl,
                title: t('applicantVideo', { name: playItem.userName || t('nameUnset') }),
                thumbnail: playItem.thumbnailUrl ?? undefined,
              }
            : undefined
        }
        onClose={() => setPlayItem(null)}
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
