import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Linking, StyleSheet, Text, View } from 'react-native'
import { voteApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { useAuth } from '../../../src/auth/AuthProvider'
import { ApiError } from '../../../src/api/http'
import { Button } from '../../../src/ui/Button'
import { EmptyState, ErrorState } from '../../../src/ui/EmptyState'
import { Screen } from '../../../src/ui/Screen'
import { colors, radius } from '../../../src/theme/tokens'

export default function VoteScreen() {
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
      {query.isError ? <ErrorState message="투표 보드를 불러오지 못했습니다." onRetry={() => void query.refetch()} /> : null}
      {page ? (
        <View style={styles.head}>
          <Text style={styles.title}>{page.audition.title}</Text>
          <Text style={styles.meta}>
            지원 {page.summary.applicantCount} · 표 {page.summary.totalVotes} · 내 표 {page.summary.myVoteCount}
          </Text>
        </View>
      ) : null}
      {(page?.items ?? []).map((item) => (
        <View key={item.applicationId} style={styles.card}>
          <Text style={styles.rank}>#{item.rank || '-'}</Text>
          <Text style={styles.name}>{item.userName || '지원자'}</Text>
          <Text style={styles.meta}>{item.description}</Text>
          <Text style={styles.meta}>표 {item.voteCount}</Text>
          {item.videoUrl ? <Button label="영상 보기" variant="secondary" onPress={() => void Linking.openURL(item.videoUrl)} /> : null}
          <Button
            label={item.isVoted ? '내 표' : '이 지원자에게 투표'}
            disabled={item.isVoted || voteMutation.isPending}
            onPress={() => {
              if (!isAuthenticated) {
                router.push('/(auth)/login')
                return
              }
              voteMutation.mutate(item.applicationId)
            }}
          />
        </View>
      ))}
      {voteMutation.isError ? (
        <Text style={styles.error}>{voteMutation.error instanceof ApiError ? voteMutation.error.message : '투표에 실패했습니다.'}</Text>
      ) : null}
      {!query.isLoading && (page?.items.length ?? 0) === 0 ? <EmptyState title="아직 투표할 지원자가 없습니다" /> : null}
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
