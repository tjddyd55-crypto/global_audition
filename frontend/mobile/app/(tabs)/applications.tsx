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

export default function MyApplicationsScreen() {
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
        <EmptyState title="로그인이 필요합니다" body="내 지원 현황을 보려면 로그인하세요." actionLabel="로그인" onAction={() => router.push('/(auth)/login')} />
      </Screen>
    )
  }

  return (
    <Screen loading={query.isLoading}>
      <Text style={styles.heading}>내 지원</Text>
      {query.isError ? <ErrorState message="지원 목록을 불러오지 못했습니다." onRetry={() => void query.refetch()} /> : null}
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
        <EmptyState title="아직 지원한 오디션이 없습니다" actionLabel="오디션 보기" onAction={() => router.push('/(tabs)/auditions')} />
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
