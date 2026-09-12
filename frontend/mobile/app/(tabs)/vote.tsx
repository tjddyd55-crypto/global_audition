import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { auditionApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { audienceCountryFromLocale } from '../../src/domain/audience'
import { getRuntimeLocale } from '../../src/i18n/runtime'
import { narrow } from '../../src/theme/narrow'
import { AuditionCard } from '../../src/ui/AuditionCard'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { colors, space } from '../../src/theme/tokens'

export default function VoteHubScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const country = audienceCountryFromLocale(getRuntimeLocale())
  const query = useQuery({
    queryKey: queryKeys.auditionsOpen(country),
    queryFn: () => auditionApi.listOpen(country),
  })

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.heading}>{t('vote.hubTitle')}</Text>
      <Text style={styles.hint}>{t('vote.hubHint')}</Text>
      {query.isError ? <ErrorState message={t('vote.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((audition) => (
        <View key={audition.id} style={styles.cardWrap}>
          <AuditionCard audition={audition} onPress={() => router.push(`/auditions/${audition.id}/vote`)} />
        </View>
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? <EmptyState title={t('vote.emptyHub')} /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, marginBottom: space.xs, ...narrow.shrink },
  hint: { fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: space.md, ...narrow.shrink },
  cardWrap: { marginBottom: space.sm },
})
