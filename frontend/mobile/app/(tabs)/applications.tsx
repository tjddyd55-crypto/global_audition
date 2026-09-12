import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text } from 'react-native'
import { applicationApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { applicationResultCopy, applicationStatusLabel } from '../../src/domain/statusLabels'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { StatusPill, toneForApplicationStatus } from '../../src/ui/StatusPill'
import { colors, radius } from '../../src/theme/tokens'
import { useTranslation } from 'react-i18next'

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
        <EmptyState title={t('myApplications.loginTitle')} body={t('myApplications.loginBody')} actionLabel={t('common.login')} onAction={() => router.push('/(auth)/login')} />
      </Screen>
    )
  }

  return (
    <Screen loading={query.isLoading} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.heading}>{t('myApplications.title')}</Text>
      {query.isError ? <ErrorState message={t('myApplications.loadFailed')} onRetry={() => void query.refetch()} /> : null}
      {(query.data ?? []).map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push(`/applications/${item.id}`)}
          style={styles.card}
          accessibilityRole="button"
          accessibilityLabel={item.auditionTitle}
        >
          <StatusPill label={applicationStatusLabel(item.status)} tone={toneForApplicationStatus(item.status)} />
          <Text style={styles.title}>{item.auditionTitle}</Text>
          <Text style={styles.meta}>{applicationResultCopy(item.status)}</Text>
        </Pressable>
      ))}
      {!query.isLoading && (query.data?.length ?? 0) === 0 ? (
        <EmptyState title={t('myApplications.empty')} actionLabel={t('myApplications.browse')} onAction={() => router.push('/(tabs)/auditions')} />
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', marginBottom: 16, color: colors.text },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 20 },
})
