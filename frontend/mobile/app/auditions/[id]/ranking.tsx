import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { rankingApi } from '../../../src/api/endpoints'
import { queryKeys } from '../../../src/api/queryKeys'
import { applicationStatusLabel } from '../../../src/domain/statusLabels'
import { isRankingAccessDenied, rankingAvatar, rankingViewState } from '../../../src/domain/ranking'
import { EmptyState, ErrorState } from '../../../src/ui/EmptyState'
import { Screen } from '../../../src/ui/Screen'
import { colors, radius } from '../../../src/theme/tokens'

export default function RankingScreen() {
  const { t } = useTranslation()
  const { id } = useLocalSearchParams<{ id: string }>()
  const query = useQuery({
    queryKey: queryKeys.ranking(id),
    queryFn: () => rankingApi.page(id),
    enabled: Boolean(id),
    // 401/403 은 재시도해도 같으므로 바로 안내를 보여 준다(공개 랭킹에서는 정상적으로 오지 않는다).
    retry: (failureCount, error) => !isRankingAccessDenied(error) && failureCount < 2,
  })
  const view = rankingViewState({
    isLoading: query.isLoading,
    error: query.error,
    count: query.data?.items.length ?? 0,
    votingEnabled: query.data?.votingEnabled,
  })

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>{t('ranking.title')}</Text>
      {view === 'list' || view === 'empty' ? (
        <Text style={styles.basis}>{t('ranking.roundBasis', { round: query.data?.roundNumber ?? 1 })}</Text>
      ) : null}
      {view === 'error' ? <ErrorState message={t('ranking.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {view === 'restricted' ? <EmptyState title={t('ranking.restricted')} /> : null}
      {view === 'disabled' ? <EmptyState title={t('ranking.disabledRound')} /> : null}
      {view === 'empty' ? <EmptyState title={t('ranking.empty')} /> : null}
      {(view === 'list' ? (query.data?.items ?? []) : []).map((item) => {
        const avatar = rankingAvatar(item)
        // 공개 응답은 득표·순위만. 분류·지원 상태는 공고 기획사(manageView)에게만 보인다.
        const manageMeta = query.data?.manageView
          ? ` · ${item.category}${item.status ? ` · ${applicationStatusLabel(item.status) || item.status}` : ''}`
          : ''
        return (
          <View key={item.applicationId} style={styles.row}>
            <Text style={styles.rank}>{item.rank}</Text>
            {avatar.uri ? (
              <Image source={{ uri: avatar.uri }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarInitial}>{avatar.initial}</Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.userName}</Text>
              <Text style={styles.meta}>
                {t('ranking.votesMeta', { n: item.voteCount })}
                {manageMeta}
              </Text>
            </View>
          </View>
        )
      })}
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
  basis: { color: colors.muted, fontSize: 13, marginTop: -10, marginBottom: 12 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarFallback: { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontWeight: '700', color: colors.purple },
  name: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted, fontSize: 13 },
})
