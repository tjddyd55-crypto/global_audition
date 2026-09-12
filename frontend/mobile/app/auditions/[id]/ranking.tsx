import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { rankingApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { applicationStatusLabel } from '../../../src/domain/statusLabels'
import { EmptyState, ErrorState } from '../../../src/ui/EmptyState'
import { Screen } from '../../../src/ui/Screen'
import { colors, radius } from '../../../src/theme/tokens'

export default function RankingScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const query = useQuery({ queryKey: queryKeys.ranking(id), queryFn: () => rankingApi.list(id), enabled: Boolean(id) })

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>{t('ranking.title')}</Text>
      {query.isError ? <ErrorState message={t('ranking.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((item) => (
        <View key={item.applicationId} style={styles.row}>
          <Text style={styles.rank}>{item.rank}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.userName}</Text>
            <Text style={styles.meta}>
              {item.category} · {t('ranking.votesMeta', { n: item.voteCount })} · {applicationStatusLabel(item.status) || item.status}
            </Text>
          </View>
        </View>
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? <EmptyState title={t('ranking.empty')} /> : null}
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
