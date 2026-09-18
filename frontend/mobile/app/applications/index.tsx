import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { useTranslation } from 'react-i18next'
import { applicationApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { narrow } from '../../src/theme/narrow'
import { ApplicationListRow } from '../../src/ui/ApplicationListRow'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { colors, space } from '../../src/theme/tokens'

export default function MyApplicationsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { isAuthenticated, ready } = useAuth()
  const query = useQuery({
    queryKey: queryKeys.myApplications,
    queryFn: applicationApi.listMine,
    enabled: isAuthenticated,
  })

  if (ready && !isAuthenticated) {
    return (
      <Screen>
        <EmptyState
          title={t('myApplications.loginTitle')}
          body={t('myApplications.loginBody')}
          actionLabel={t('common.login')}
          onAction={() => router.push('/(auth)/login')}
        />
      </Screen>
    )
  }

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.heading}>{t('myApplications.listTitle')}</Text>
      <Text style={styles.hint}>{t('myApplications.listHint')}</Text>
      {query.isError ? <ErrorState message={t('myApplications.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((item) => (
        <ApplicationListRow key={item.id} item={item} onPress={() => router.push(`/applications/${item.id}`)} />
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState
          title={t('myApplications.emptyList')}
          actionLabel={t('myApplications.browse')}
          onAction={() => router.push('/(tabs)/auditions')}
        />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', marginBottom: space.xs, color: colors.text, ...narrow.shrink },
  hint: { fontSize: 14, color: colors.muted, lineHeight: 22, marginBottom: space.md, ...narrow.shrink },
})
