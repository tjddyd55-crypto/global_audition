import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { auditionApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { sortAuditionsByRecent } from '../../src/domain/auditionLists'
import { AuditionListRow } from '../../src/ui/AuditionListRow'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { AuditionListSkeleton } from '../../src/ui/ListSkeleton'
import { Screen } from '../../src/ui/Screen'
import { colors, space } from '../../src/theme/tokens'
import { useTranslation } from 'react-i18next'
import { audienceCountryFromLocale } from '../../src/domain/audience'
import { getRuntimeLocale } from '../../src/i18n/runtime'

export default function AuditionsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const country = audienceCountryFromLocale(getRuntimeLocale())
  const query = useQuery({
    queryKey: queryKeys.auditionsOpen(country),
    queryFn: () => auditionApi.listOpen(country),
  })

  const items = useMemo(() => sortAuditionsByRecent(query.data ?? []), [query.data])

  return (
    <Screen
      loading={false}
      refreshing={query.isFetching}
      onRefresh={() => void query.refetch()}
    >
      <Text style={styles.title}>{t('auditions.listTitle')}</Text>
      <Text style={styles.meta}>
        {t('auditions.resultCount', { count: items.length })} · {t('auditions.sortRecent')}
      </Text>

      {query.isLoading ? <AuditionListSkeleton /> : null}
      {query.isError ? <ErrorState message={t('auditions.loadFailed')} onRetry={() => void query.refetch()} /> : null}

      {items.map((audition) => (
        <View key={audition.id} style={styles.rowGap}>
          <AuditionListRow audition={audition} onPress={() => router.push(`/auditions/${audition.id}`)} />
        </View>
      ))}

      {!query.isLoading && items.length === 0 ? (
        <EmptyState title={t('auditions.empty')} body={t('home.emptyBody')} />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: space.xxs,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: space.md,
  },
  rowGap: { marginBottom: space.sm },
})
