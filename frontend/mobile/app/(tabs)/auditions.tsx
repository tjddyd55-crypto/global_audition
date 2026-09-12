import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { View } from 'react-native'
import { auditionApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { AuditionCard } from '../../src/ui/AuditionCard'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
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

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      {query.isError ? <ErrorState message={t('home.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((audition) => (
        <View key={audition.id} style={{ marginBottom: 12 }}>
          <AuditionCard audition={audition} onPress={() => router.push(`/auditions/${audition.id}`)} />
        </View>
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title={t('auditions.empty')} body={t('home.emptyBody')} />
      ) : null}
    </Screen>
  )
}
