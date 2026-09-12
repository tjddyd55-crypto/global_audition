import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { rankingApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { applicationStatusLabel } from '../../../src/domain/statusLabels'
import { narrow } from '../../../src/theme/narrow'
import { Button } from '../../../src/ui/Button'
import { EmptyState, ErrorState } from '../../../src/ui/EmptyState'
import { Screen } from '../../../src/ui/Screen'
import { colors, radius, space } from '../../../src/theme/tokens'

export default function RankingScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const query = useQuery({ queryKey: queryKeys.ranking(id), queryFn: () => rankingApi.list(id), enabled: Boolean(id) })

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>{t('ranking.title')}</Text>
      <Button label={t('ranking.backToAudition')} variant="secondary" onPress={() => router.push(`/auditions/${id}`)} />
      {query.isError ? <ErrorState message={t('ranking.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((item) => (
        <View key={item.applicationId} style={styles.row}>
          <Text style={styles.rank}>{item.rank}</Text>
          <View style={narrow.shrink}>
            <Text style={styles.name} numberOfLines={1}>{item.userName}</Text>
            <Text style={styles.meta} numberOfLines={2}>
              {item.category ? `${item.category} · ` : ''}
              {t('ranking.votesMeta', { n: item.voteCount })}
              {item.viewCount > 0 ? ` · ${t('profile.viewsCount', { n: item.viewCount })}` : ''}
              {' · '}
              {applicationStatusLabel(item.status) || item.status}
            </Text>
          </View>
        </View>
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? <EmptyState title={t('ranking.empty')} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: space.sm, color: colors.text, ...narrow.shrink },
  row: {
    ...narrow.row,
    gap: space.sm,
    padding: space.sm,
    borderRadius: radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.xs,
    alignItems: 'flex-start',
  },
  rank: { width: 32, fontWeight: '800', color: colors.purple, fontSize: 18, flexShrink: 0 },
  name: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20 },
})
