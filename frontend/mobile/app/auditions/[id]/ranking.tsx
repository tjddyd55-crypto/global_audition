import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { rankingApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { applicationStatusLabel } from '../../../src/domain/statusLabels'
import { EmptyState, ErrorState } from '../../../src/ui/EmptyState'
import { Screen } from '../../../src/ui/Screen'
import { colors, radius } from '../../../src/theme/tokens'

export default function RankingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const query = useQuery({ queryKey: queryKeys.ranking(id), queryFn: () => rankingApi.list(id), enabled: Boolean(id) })

  return (
    <Screen loading={query.isLoading}>
      <Text style={styles.title}>랭킹</Text>
      {query.isError ? <ErrorState message="랭킹을 불러오지 못했습니다." onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((item) => (
        <View key={item.applicationId} style={styles.row}>
          <Text style={styles.rank}>{item.rank}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.userName}</Text>
            <Text style={styles.meta}>
              {item.category} · 표 {item.voteCount} · {applicationStatusLabel(item.status) || item.status}
            </Text>
          </View>
        </View>
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? <EmptyState title="랭킹 데이터가 없습니다" /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 16, color: colors.text },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
    alignItems: 'center',
  },
  rank: { width: 28, fontWeight: '800', color: colors.purple, fontSize: 18 },
  name: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
})
