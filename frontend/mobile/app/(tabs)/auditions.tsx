import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { auditionApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { AuditionCard } from '../../src/ui/AuditionCard'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { useTranslation } from 'react-i18next'
import { AudienceFilter } from '../../src/ui/AudienceFilter'
import { useAudienceCountry } from '../../src/domain/AudienceCountryProvider'
import { getRuntimeLocale } from '../../src/i18n/runtime'
import { colors } from '../../src/theme/tokens'

export default function AuditionsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const locale = getRuntimeLocale()
  const { country } = useAudienceCountry()
  const query = useQuery({
    queryKey: queryKeys.auditionsOpen(country, locale),
    queryFn: () => auditionApi.listOpen(country),
  })

  return (
    // 국가를 바꿀 때 화면 전체를 로딩으로 바꾸면 필터 칩 줄이 다시 마운트되어 가로 스크롤이 처음으로 돌아간다.
    // 필터는 유지하고 목록 자리에서만 로딩을 보여 준다.
    <Screen topInset={false} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <AudienceFilter />
      {query.isLoading ? <ActivityIndicator color={colors.purple} size="large" style={{ marginTop: 24 }} /> : null}
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
