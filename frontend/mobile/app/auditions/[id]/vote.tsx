import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { voteApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { useAuth } from '../../../src/auth/AuthProvider'
import { ApiError } from '../../../src/api/http'
import { Button } from '../../../src/ui/Button'
import { EmptyState, ErrorState } from '../../../src/ui/EmptyState'
import { Screen } from '../../../src/ui/Screen'
import { VoteInlineVideo } from '../../../src/features/vote/VoteInlineVideo'
import { colors, radius } from '../../../src/theme/tokens'
import { WEB_URL } from '../../../src/config/env'
import { VoteShareActions } from '../../../src/features/vote/VoteShareActions'
import { SharedCandidateLanding } from '../../../src/features/vote/SharedCandidateLanding'
import { parseShareParams, voteSharePath, voteShareUrl } from '../../../../web/src/shared/vote/voteShare'
import { canShowPublicVoteCount, remainingMessage, voteRemaining } from '../../../../web/src/shared/vote/voteRemaining'
import { formatVoteDate } from '../../../../web/src/shared/vote/voteDate'
import { voteLabelKey } from '../../../../web/src/shared/vote/voteLabels'
import type { PublicVoteItem } from '../../../src/api/types'

export default function VoteScreen() {
  const { t, i18n } = useTranslation()
  const lang = (i18n.language || 'ko').split('-')[0]
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [shareOpenId, setShareOpenId] = useState<string | null>(null)
  const [votedName, setVotedName] = useState<string | null>(null)
  const [now, setNow] = useState(() => new Date())
  const params = useLocalSearchParams<{ id: string; round?: string; candidate?: string }>()
  const id = params.id
  // 공유 링크(웹·앱 딥링크)에서 온 회차·후보. 잘못된 값은 버린다.
  const share = parseShareParams(params.round, params.candidate)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const query = useQuery({
    queryKey: [...queryKeys.votes(id), share.round, share.candidate, lang],
    queryFn: () => voteApi.list(id, undefined, { ...share, locale: lang }),
    enabled: Boolean(id),
  })
  const castInFlight = useRef(false)
  const voteMutation = useMutation({
    mutationFn: async ({ applicationId }: { applicationId: string; name: string }) => {
      // 연타로 요청이 겹치지 않게 막는다.
      if (castInFlight.current) return null
      castInFlight.current = true
      try {
        return await voteApi.cast(id, applicationId)
      } finally {
        castInFlight.current = false
      }
    },
    onSuccess: (_res, vars) => {
      setVotedName(vars.name)
      void queryClient.invalidateQueries({ queryKey: queryKeys.votes(id) })
    },
  })

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const page = query.data
  const shared = page?.sharedCandidate ?? null
  const linkRound = page?.roundNumber ?? 1
  const urlFor = (item: PublicVoteItem) => voteShareUrl(WEB_URL, lang, id, linkRound, item.applicationId)
  const nameOf = (item: PublicVoteItem) => item.userName || t('vote.applicantFallback')
  const castFor = (item: PublicVoteItem) => {
    if (!isAuthenticated) {
      // 로그인 뒤 같은 후보 화면으로 돌아온다. 돌아와도 자동 투표는 하지 않는다.
      const back = share.candidate && share.round ? voteSharePath(id, share.round, share.candidate) : `/auditions/${id}/vote`
      router.push({ pathname: '/(auth)/login', params: { next: back } })
      return
    }
    voteMutation.mutate({ applicationId: item.applicationId, name: nameOf(item) })
  }
  const windowNotice = page?.votingEnabled
    ? null
    : page?.voteStatus === 'SCHEDULED'
      ? t('vote.scheduled', { start: formatVoteDate(page.voteStartAt, lang) })
      : page?.voteStatus === 'CLOSED'
        ? t('vote.closedResults')
        : t('vote.notStarted')

  const phase = page?.voteStatus
  const remain = remainingMessage(voteRemaining(page?.voteEndAt, now), (key, values) => t(`voteShare.${key}`, values ?? { n: 0 }))
  const listStatus =
    phase === 'OPEN' && remain
      ? t('voteShare.openWithRemaining', { remaining: remain })
      : phase === 'OPEN'
        ? t('vote.statusOpen')
        : phase === 'SCHEDULED'
          ? t('vote.statusScheduled')
          : phase === 'CLOSED'
            ? t('vote.statusClosed')
            : t('vote.notStarted')
  const ownVotesText = (n: number) => t(voteLabelKey(n, lang, 'voteShare.ownVotes', 'voteShare.ownVotesOne'), { n })

  const sharedVoted = Boolean(shared && page?.votingEnabled && page.myVoteApplicationId === shared.applicationId)


  // 유효한 공유 링크면 해당 후보만 보여 준다. 잘못된 후보 값은 shared 가 없어 전체 화면으로 간다.
  if (shared && page && !query.isError) {
    return (
      <Screen topInset={false} bottomInset loading={query.isLoading}>
        <SharedCandidateLanding
          page={page}
          shared={shared}
          url={urlFor(shared)}
          voted={sharedVoted}
          voteBusy={voteMutation.isPending}
          windowNotice={windowNotice}
          onVote={() => castFor(shared)}
          onViewAll={() =>
            router.replace({
              pathname: '/auditions/[id]/vote',
              // 후보 파라미터를 넣지 않아 공유 전용 화면에서 벗어난다. 남은 candidate 는 비운다.
              params: { id, round: String(linkRound), candidate: undefined },
            } as never)
          }
        />
        {voteMutation.isError ? (
          <Text style={styles.error}>{voteMutation.error instanceof ApiError ? voteMutation.error.message : t('vote.failed')}</Text>
        ) : null}
      </Screen>
    )
  }

  return (
    <Screen topInset={false} bottomInset loading={query.isLoading}>
      {query.isError ? <ErrorState message={t('vote.loadFailed')} onRetry={() => void query.refetch()} retryLabel={t('voteShare.retry')} /> : null}
      {votedName ? <Text style={styles.success} testID="vote-success">{t('voteShare.votedFor', { name: votedName })}</Text> : null}
      {page && !page.votingEnabled && (page.voteStatus !== 'CLOSED' || page.items.length === 0) ? (
        <EmptyState
          title={
            page.votingPlanEnabled === false
              ? t('vote.disabledRound')
              : page.voteStatus === 'SCHEDULED'
                ? t('vote.scheduled', { start: formatVoteDate(page.voteStartAt, lang) })
                : page.voteStatus === 'CLOSED'
                  ? t('vote.closedResults')
                  : t('vote.notStarted')
          }
        />
      ) : null}
      {page && (page.votingEnabled || (page.voteStatus === 'CLOSED' && page.items.length > 0)) ? (
        <View style={styles.head}>
          <Text style={styles.round}>{t('voteShare.roundLabel', { round: linkRound })}</Text>
          <Text style={styles.title}>{page.audition.title}</Text>
          <Text style={styles.status} testID="vote-status-line">{listStatus}</Text>
          {page.voteEndAt ? <Text style={styles.meta}>{t('voteShare.endsAt', { end: formatVoteDate(page.voteEndAt, lang) })}</Text> : null}
          <Text style={styles.meta}>
            {page.voteStatus === 'CLOSED'
              ? t('vote.closedResults')
              : t('vote.summary', {
                  applicants: page.summary.applicantCount,
                  votes: page.summary.totalVotes,
                  mine: page.summary.myVoteCount,
                })}
          </Text>
        </View>
      ) : null}
      {(page && (page.votingEnabled || (page.voteStatus === 'CLOSED' && page.items.length > 0)) ? page.items : []).map((item) => (
        <View key={item.applicationId} style={[styles.card, item.isVoted ? styles.votedCard : null]}>
          <View style={styles.metaRow}>
            <View style={styles.nameBlock}>
              <Text style={styles.name} numberOfLines={2}>{item.candidateNumber ? `${t('vote.candidateNumber', { n: item.candidateNumber })} | ` : ''}{item.userName || t('vote.applicantFallback')}</Text>
              {item.category ? <Text style={styles.field} numberOfLines={1}>{item.category}</Text> : null}
            </View>
            {canShowPublicVoteCount(page?.voteStatus) ? (
              <Text style={styles.votes}>{ownVotesText(item.voteCount)}</Text>
            ) : null}
          </View>
          <VoteInlineVideo
            videoUrl={item.videoUrl}
            thumbnailUrl={item.thumbnailUrl}
            playing={playingId === item.applicationId}
            onPlay={() => setPlayingId(item.applicationId)}
            compact
          />
          <View style={styles.actions}>
            {page?.votingEnabled ? (
              <View style={styles.cell}>
                <Button
                fillHeight
                  label={item.isVoted ? t('vote.myVote') : t('vote.voteAction')}
                  disabled={item.isVoted || voteMutation.isPending}
                  onPress={() => castFor(item)}
                />
              </View>
            ) : null}
            <View style={styles.cell}>
              <Button
                fillHeight
                label={t('voteShare.share')}
                variant="secondary"
                onPress={() => setShareOpenId((id) => (id === item.applicationId ? null : item.applicationId))}
              />
            </View>
          </View>
          {shareOpenId === item.applicationId ? (
            <VoteShareActions url={urlFor(item)} title={t(item.candidateNumber ? 'voteShare.numberedShareTitle' : 'voteShare.shareTitle', { name: nameOf(item), number: item.candidateNumber ?? 0 })} text={t(item.candidateNumber ? 'voteShare.numberedCandidateText' : 'voteShare.candidateText', { name: nameOf(item), number: item.candidateNumber ?? 0, round: linkRound })} />
          ) : null}
        </View>
      ))}
      {voteMutation.isError ? (
        <Text style={styles.error}>{voteMutation.error instanceof ApiError ? voteMutation.error.message : t('vote.failed')}</Text>
      ) : null}
      {!query.isLoading && page?.votingEnabled && (page?.items.length ?? 0) === 0 ? (
        <EmptyState title={t('vote.emptyBoard')} />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { marginBottom: 16, gap: 8, padding: 16, backgroundColor: colors.heroStart, borderRadius: radius.card },
  round: { color: colors.purple, fontWeight: '700', fontSize: 13, lineHeight: 22 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  status: { color: colors.text, fontWeight: '600', fontSize: 14 },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    paddingTop: 12,
    paddingBottom: 12,
    gap: 10,
    marginBottom: 12,
  },
  votedCard: { borderColor: colors.purple, borderWidth: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, paddingHorizontal: 16 },
  nameBlock: { flex: 1, minWidth: 0 },
  name: { fontSize: 18, fontWeight: '800', color: colors.text },
  field: { color: colors.muted, fontWeight: '600', fontSize: 13, marginTop: 2 },
  votes: { color: colors.purple, fontWeight: '800', fontSize: 18 },
  actions: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  cell: { flex: 1, minWidth: 0 },
  error: { color: colors.dangerText },
  success: { color: colors.purple, fontWeight: '700', marginBottom: 12 },
})
