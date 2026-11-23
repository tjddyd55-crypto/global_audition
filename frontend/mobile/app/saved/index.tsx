import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { auditionSavesApi, type SavedAuditionItem } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { RequireAuth } from '../../src/auth/RequireAuth'
import { SaveAuditionButton } from '../../src/features/saves/SaveAuditionButton'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { colors } from '../../src/theme/tokens'

function statusLabel(item: SavedAuditionItem, t: (key: string) => string) {
  if (item.recruitmentStatus === 'CLOSED') return t('savedAuditions.statusClosed')
  if (item.recruitmentStatus === 'UPCOMING') return t('savedAuditions.statusUpcoming')
  return t('savedAuditions.statusOpen')
}

export default function SavedAuditionsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const query = useQuery({
    queryKey: queryKeys.savedAuditions,
    queryFn: auditionSavesApi.list,
  })

  return (
    <RequireAuth message={t('savedAuditions.loginRequired')}>
      <Screen
        topInset={false}
        refreshing={query.isFetching}
        onRefresh={() => void query.refetch()}
      >
        <Text style={styles.title}>{t('savedAuditions.title')}</Text>
        {query.isError ? <ErrorState message={t('common.loadFailedTitle')} onRetry={() => void query.refetch()} /> : null}
        {!query.isLoading && (query.data?.length ?? 0) === 0 ? <EmptyState title={t('savedAuditions.empty')} /> : null}
        {(query.data ?? []).map((item) => {
          if (!item.available) {
            return (
              <View key={item.auditionId} style={styles.card}>
                <Text style={styles.cardTitle}>{t('savedAuditions.unavailable')}</Text>
                <Text style={styles.meta}>{t('savedAuditions.unavailableHint')}</Text>
                <View style={styles.hiddenAction}>
                  <SaveAuditionButton auditionId={item.auditionId} />
                </View>
              </View>
            )
          }
          return (
            <View key={item.auditionId} style={styles.card}>
              <Pressable
                style={styles.row}
                accessibilityRole="button"
                onPress={() => router.push(`/auditions/${item.auditionId}`)}
              >
                {item.coverImage ? <Image source={{ uri: item.coverImage }} style={styles.thumb} /> : <View style={styles.thumb} />}
                <View style={styles.body}>
                  <Text style={styles.status}>{statusLabel(item, t)}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                  {item.agencyName ? <Text style={styles.meta}>{item.agencyName}</Text> : null}
                </View>
              </Pressable>
              <View style={styles.heart}>
                <SaveAuditionButton auditionId={item.auditionId} />
              </View>
            </View>
          )
        })}
      </Screen>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  row: { flexDirection: 'row', minHeight: 96 },
  thumb: { width: 108, backgroundColor: colors.border },
  body: { flex: 1, padding: 12, paddingRight: 48 },
  status: { fontSize: 11, fontWeight: '700', color: colors.purple, marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, marginTop: 4 },
  heart: { position: 'absolute', right: 10, top: 10 },
  hiddenAction: { padding: 12 },
})
