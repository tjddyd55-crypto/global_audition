import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { agencyApi, auditionApi, isAgencyRole } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { agencyBoardStatusLabel } from '../../src/domain/statusLabels'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { StatusPill, toneForApplicationStatus } from '../../src/ui/StatusPill'
import { colors, radius } from '../../src/theme/tokens'
import type { AgencyBoardStatus } from '../../src/api/types'

export default function AgencyApplicantsScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const params = useLocalSearchParams<{ auditionId?: string; status?: AgencyBoardStatus }>()
  const mineQuery = useQuery({ queryKey: queryKeys.myAuditions, queryFn: auditionApi.listMine, enabled: isAgencyRole(session?.role) })
  const auditionId = params.auditionId || mineQuery.data?.[0]?.id
  const manageQuery = useQuery({
    queryKey: queryKeys.manage(auditionId ?? '', params.status),
    queryFn: () => agencyApi.listManage(auditionId!, params.status),
    enabled: Boolean(auditionId),
  })

  if (!isAgencyRole(session?.role)) {
    return (
      <Screen>
        <EmptyState title="기획사 계정만 사용할 수 있습니다" />
      </Screen>
    )
  }

  return (
    <Screen loading={mineQuery.isLoading || manageQuery.isLoading}>
      <Text style={styles.title}>지원자 관리</Text>
      <View style={styles.chips}>
        {(mineQuery.data ?? []).map((audition) => (
          <Pressable
            key={audition.id}
            onPress={() => router.setParams({ auditionId: audition.id })}
            style={[styles.chip, auditionId === audition.id && styles.chipOn]}
          >
            <Text style={styles.chipText}>{audition.title}</Text>
          </Pressable>
        ))}
      </View>
      {manageQuery.data ? (
        <Text style={styles.meta}>
          전체 {manageQuery.data.stats.total} · 대기 {manageQuery.data.stats.submitted} · 검토 {manageQuery.data.stats.reviewing} · 합격{' '}
          {manageQuery.data.stats.accepted} · 불합격 {manageQuery.data.stats.rejected}
          {manageQuery.data.audition.processMode === 'MULTI_ROUND' ? ` · maxRound ${manageQuery.data.maxRound}` : ''}
        </Text>
      ) : null}
      {manageQuery.isError ? <ErrorState message="지원자 목록을 불러오지 못했습니다." onRetry={() => void manageQuery.refetch()} /> : null}
      {(manageQuery.data?.items ?? []).map((item) => (
        <Pressable
          key={item.applicationId}
          onPress={() => router.push(`/agency/${item.applicationId}`)}
          style={styles.card}
          accessibilityRole="button"
        >
          <StatusPill label={agencyBoardStatusLabel(item.status)} tone={toneForApplicationStatus(item.status)} />
          <Text style={styles.name}>{item.name || item.userName}</Text>
          <Text style={styles.meta}>
            {item.category} · {item.age ?? '-'}세 · 라운드 {item.round} · 표 {item.voteCount}
          </Text>
        </Pressable>
      ))}
      {!manageQuery.isLoading && (manageQuery.data?.items.length ?? 0) === 0 ? <EmptyState title="지원자가 없습니다" /> : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 12, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.heroStart, borderColor: colors.purple },
  chipText: { fontSize: 12, color: colors.text },
  meta: { color: colors.muted, marginBottom: 12, lineHeight: 20 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
    gap: 6,
    marginBottom: 10,
  },
  name: { fontWeight: '700', color: colors.text, fontSize: 16 },
})
