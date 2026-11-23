import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
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

export default function VoteScreen() {
  const { t } = useTranslation()
  const [playingId, setPlayingId] = useState<string | null>(null)
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const query = useQuery({ queryKey: queryKeys.votes(id), queryFn: () => voteApi.list(id), enabled: Boolean(id) })
  const voteMutation = useMutation({
    mutationFn: (applicationId: string) => voteApi.cast(id, applicationId),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.votes(id) }),
  })

  const page = query.data

  return (
    <Screen loading={query.isLoading}>
      {query.isError ? <ErrorState message={t('vote.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {page && !page.votingEnabled && (page.voteStatus !== 'CLOSED' || page.items.length === 0) ? (
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
            onPress={() => {
              if (!isAuthenticated) {
                router.push('/(auth)/login')
                return
              }
              voteMutation.mutate(item.applicationId)
            }}
          />
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
})
