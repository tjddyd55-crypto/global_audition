import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useRef, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { voteApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { useAuth } from '../../../src/auth/AuthProvider'
import { ApiError } from '../../../src/api/http'
import { Button } from '../../../src/ui/Button'
import { EmptyState, ErrorState } from '../../../src/ui/EmptyState'
import { Screen } from '../../../src/ui/Screen'
import { NativeVideoPlayer } from '../../../src/features/media/NativeVideoPlayer'
import { colors, radius } from '../../../src/theme/tokens'
import { WEB_URL } from '../../../src/config/env'
import { VoteShareActions } from '../../../src/features/vote/VoteShareActions'
import { parseShareParams, voteSharePath, voteShareUrl } from '../../../../web/src/shared/vote/voteShare'
import { youtubeThumbnailUrl } from '../../../src/domain/videoUrl'
import type { PublicVoteItem } from '../../../src/api/types'

export default function VoteScreen() {
  const { t, i18n } = useTranslation()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [shareOpenId, setShareOpenId] = useState<string | null>(null)
  const [votedName, setVotedName] = useState<string | null>(null)
  const params = useLocalSearchParams<{ id: string; round?: string; candidate?: string }>()
  const id = params.id
  // 공유 링크(웹·앱 딥링크)에서 온 회차·후보. 잘못된 값은 버린다.
  const share = parseShareParams(params.round, params.candidate)
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const query = useQuery({
    queryKey: [...queryKeys.votes(id), share.round, share.candidate],
    queryFn: () => voteApi.list(id, undefined, share),
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

  const page = query.data
  const shared = page?.sharedCandidate ?? null
  const linkRound = page?.roundNumber ?? 1
  const lang = (i18n.language || 'ko').split('-')[0]
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
      ? t('vote.scheduled', { start: page.voteStartAt ?? '' })
      : page?.voteStatus === 'CLOSED'
        ? t('vote.closedResults')
        : t('vote.notStarted')

  return (
    <Screen loading={query.isLoading}>
      {query.isError ? <ErrorState message={t('vote.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {shared ? (
        <View style={styles.sharedCard} testID="vote-shared-candidate">
          {shared.thumbnailUrl || youtubeThumbnailUrl(shared.videoUrl) ? (
            <Image source={{ uri: (shared.thumbnailUrl || youtubeThumbnailUrl(shared.videoUrl)) as string }} style={styles.sharedThumb} />
          ) : null}
          <Text style={styles.badge}>{t('voteShare.sharedBadge')} · {t('voteShare.roundLabel', { round: linkRound })}</Text>
          <Text style={styles.sharedName}>{nameOf(shared)}</Text>
          {shared.category ? <Text style={styles.meta}>{shared.category}</Text> : null}
          {shared.description ? <Text style={styles.meta}>{shared.description}</Text> : null}
          {shared.videoUrl ? (
            playingId === `shared-${shared.applicationId}` ? (
              <NativeVideoPlayer videoUrl={shared.videoUrl} autoplay />
            ) : (
              <Button label={t('vote.watchVideo')} variant="secondary" onPress={() => setPlayingId(`shared-${shared.applicationId}`)} />
            )
          ) : null}
          {windowNotice ? <Text style={styles.notice}>{windowNotice}</Text> : null}
          <Button
            label={
              page?.votingEnabled && page.myVoteApplicationId === shared.applicationId
                ? t('voteShare.alreadyVoted')
                : t('voteShare.voteFor', { name: nameOf(shared) })
            }
            disabled={!page?.votingEnabled || voteMutation.isPending || page.myVoteApplicationId === shared.applicationId}
            onPress={() => castFor(shared)}
          />
          <VoteShareActions url={urlFor(shared)} title={t('voteShare.shareTitle', { name: nameOf(shared) })} text={t('voteShare.candidateText', { name: nameOf(shared) })} />
          <Text style={styles.viewAll}>{t('voteShare.viewAll')} ↓</Text>
        </View>
      ) : null}
      {votedName ? <Text style={styles.success} testID="vote-success">{t('voteShare.votedFor', { name: votedName })}</Text> : null}
      {page && !shared && !page.votingEnabled && (page.voteStatus !== 'CLOSED' || page.items.length === 0) ? (
        <EmptyState
          title={
            page.votingPlanEnabled === false
              ? t('vote.disabledRound')
              : page.voteStatus === 'SCHEDULED'
                ? t('vote.scheduled', { start: page.voteStartAt ?? '' })
                : page.voteStatus === 'CLOSED'
                  ? t('vote.closedResults')
                  : t('vote.notStarted')
          }
        />
      ) : null}
      {page && (page.votingEnabled || (page.voteStatus === 'CLOSED' && page.items.length > 0)) ? (
        <View style={styles.head}>
          <Text style={styles.title}>{page.audition.title}</Text>
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
        <View key={item.applicationId} style={styles.card}>
          <Text style={styles.rank}>#{item.rank || '-'}</Text>
          <Text style={styles.name}>{item.userName || t('vote.applicantFallback')}</Text>
          <Text style={styles.meta}>{item.description}</Text>
          <Text style={styles.meta}>{t('vote.voteCount', { n: item.voteCount })}</Text>
          {item.videoUrl ? (
            playingId === item.applicationId ? (
              <NativeVideoPlayer videoUrl={item.videoUrl} autoplay />
            ) : (
              <Button label={t('vote.watchVideo')} variant="secondary" onPress={() => setPlayingId(item.applicationId)} />
            )
          ) : null}
          {page?.votingEnabled ? (
          <Button
            label={item.isVoted ? t('vote.myVote') : t('vote.castFor')}
            disabled={item.isVoted || voteMutation.isPending}
            onPress={() => castFor(item)}
          />
          ) : null}
          {shareOpenId === item.applicationId ? (
            <VoteShareActions url={urlFor(item)} title={t('voteShare.shareTitle', { name: nameOf(item) })} text={t('voteShare.candidateText', { name: nameOf(item) })} />
          ) : (
            <Button label={t('voteShare.share')} variant="secondary" onPress={() => setShareOpenId(item.applicationId)} />
          )}
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
  head: { marginBottom: 16, gap: 6 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  rank: { color: colors.purple, fontWeight: '800' },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  error: { color: colors.dangerText },
  sharedCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 2,
    borderColor: colors.purple,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  sharedThumb: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, backgroundColor: '#111' },
  badge: { color: colors.purple, fontWeight: '700', fontSize: 12 },
  sharedName: { fontSize: 22, fontWeight: '800', color: colors.text },
  notice: { color: colors.text, backgroundColor: '#F3F4F6', padding: 10, borderRadius: 8, fontSize: 13 },
  viewAll: { color: colors.purple, fontWeight: '600', textAlign: 'center' },
  success: { color: colors.purple, fontWeight: '700', marginBottom: 12 },
})
