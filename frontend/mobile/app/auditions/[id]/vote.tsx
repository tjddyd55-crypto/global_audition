import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { voteApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { useAuth } from '../../../src/auth/AuthProvider'
import { ApiError } from '../../../src/api/http'
import { narrow } from '../../../src/theme/narrow'
import { Button } from '../../../src/ui/Button'
import { Chip } from '../../../src/ui/Chip'
import { EmptyState, ErrorState } from '../../../src/ui/EmptyState'
import { Screen } from '../../../src/ui/Screen'
import { VoteBoardRow } from '../../../src/ui/VoteBoardRow'
import { VoteSummaryGrid } from '../../../src/ui/VoteSummaryGrid'
import { colors, space } from '../../../src/theme/tokens'

export default function VoteScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const [category, setCategory] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const query = useQuery({
    queryKey: queryKeys.votes(id, category ?? undefined),
    queryFn: () => voteApi.list(id, category ?? undefined),
    enabled: Boolean(id),
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['auditions', id, 'votes'] })

  const voteMutation = useMutation({
    mutationFn: (applicationId: string) => voteApi.cast(id, applicationId),
    onSuccess: () => {
      invalidate()
      setNotice(t('vote.castSuccess'))
    },
    onError: () => setNotice(t('vote.failed')),
  })

  const cancelMutation = useMutation({
    mutationFn: (applicationId: string) => voteApi.cancel(applicationId),
    onSuccess: () => {
      invalidate()
      setNotice(t('vote.cancelSuccess'))
    },
    onError: () => setNotice(t('vote.cancelFailed')),
  })

  const page = query.data
  const summary = page?.summary
  const mutationBusy = voteMutation.isPending || cancelMutation.isPending

  const requireAuth = () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login')
      return false
    }
    return true
  }

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      {query.isError ? <ErrorState message={t('vote.loadBoardFailed')} onRetry={() => void query.refetch()} /> : null}
      {page ? (
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={2}>{page.audition.title}</Text>
          <Text style={styles.meta}>{t('vote.cheerHint')}</Text>
          <Text style={styles.meta}>
            {t('vote.summary', {
              applicants: summary?.applicantCount ?? 0,
              votes: summary?.totalVotes ?? 0,
              mine: summary?.myVoteCount ?? 0,
            })}
          </Text>
          <View style={styles.actions}>
            <Button label={t('ranking.title')} variant="secondary" onPress={() => router.push(`/auditions/${id}/ranking`)} />
            <Button label={t('vote.backToAudition')} variant="secondary" onPress={() => router.push(`/auditions/${id}`)} />
          </View>
        </View>
      ) : null}

      {summary ? (
        <VoteSummaryGrid
          applicants={summary.applicantCount}
          totalVotes={summary.totalVotes}
          totalViews={summary.totalViewCount}
          myVotes={summary.myVoteCount}
        />
      ) : null}

      {page?.audition.categories && page.audition.categories.length > 0 ? (
        <View style={styles.chips}>
          {page.audition.categories.map((c) => {
            const selected = (c.name === '전체' && category === null) || c.name === category
            return (
              <Chip
                key={c.name}
                label={c.name === '전체' ? t('vote.allCategories') : `${c.name}${c.count > 0 ? ` ${c.count}` : ''}`}
                selected={selected}
                disabled={mutationBusy}
                onPress={() => setCategory(c.name === '전체' ? null : c.name)}
              />
            )
          })}
        </View>
      ) : null}

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      {voteMutation.isError ? (
        <Text style={styles.error}>
          {voteMutation.error instanceof ApiError ? voteMutation.error.message : t('vote.failed')}
        </Text>
      ) : null}

      {(page?.items ?? []).map((item) => (
        <VoteBoardRow
          key={item.applicationId}
          item={item}
          disabled={mutationBusy}
          onVote={() => {
            if (!requireAuth()) return
            voteMutation.mutate(item.applicationId)
          }}
          onCancel={
            item.isVoted
              ? () => {
                  if (!requireAuth()) return
                  cancelMutation.mutate(item.applicationId)
                }
              : undefined
          }
        />
      ))}

      {!query.isLoading && (page?.items.length ?? 0) === 0 ? <EmptyState title={t('vote.emptyApplicants')} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  head: { marginBottom: space.md, gap: space.xs },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, ...narrow.shrink },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20, ...narrow.shrink },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.xs },
  chips: { ...narrow.wrap, marginBottom: space.md },
  notice: { color: colors.purple, fontWeight: '600', marginBottom: space.sm, ...narrow.shrink },
  error: { color: colors.dangerText, marginBottom: space.sm, ...narrow.shrink },
})
