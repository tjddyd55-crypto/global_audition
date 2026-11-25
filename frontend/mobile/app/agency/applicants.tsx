import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { agencyApi, auditionApi, isAgencyRole } from '../../src/api/endpoints'
import { agencyCopy } from '../../src/i18n/agencyCopy'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { agencyBoardStatusLabel } from '../../src/domain/statusLabels'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { parseEntryNumber } from '../../../web/src/shared/audition/entryNumbers'
import { TextField } from '../../src/ui/TextField'
import { StatusPill, toneForApplicationStatus } from '../../src/ui/StatusPill'
import { colors, radius } from '../../src/theme/tokens'
import type { AgencyBoardStatus } from '../../src/api/types'

export default function AgencyApplicantsScreen() {
  const router = useRouter()
  const { session } = useAuth()
  const params = useLocalSearchParams<{ auditionId?: string; status?: AgencyBoardStatus; round?: string; applicantNumber?: string }>()
  const round = parseEntryNumber(params.round)
  const applicantNumber = params.applicantNumber?.trim() ? Number(params.applicantNumber) || 0 : undefined
  const mineQuery = useQuery({ queryKey: queryKeys.myAuditions, queryFn: auditionApi.listMine, enabled: isAgencyRole(session?.role) })
  const auditionId = params.auditionId || mineQuery.data?.[0]?.id
  const manageQuery = useQuery({
    queryKey: [...queryKeys.manage(auditionId ?? '', params.status), round ?? null, applicantNumber ?? null],
    queryFn: () => agencyApi.listManage(auditionId!, params.status, round, applicantNumber),
    enabled: Boolean(auditionId),
  })

  if (!isAgencyRole(session?.role)) {
    return (
      <Screen>
        <EmptyState title={agencyCopy('agency.agencyOnly')} />
      </Screen>
    )
  }

  return (
    <Screen loading={mineQuery.isLoading || manageQuery.isLoading}>
      <Text style={styles.title}>{agencyCopy('agency.applicants')}</Text>
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
          {agencyCopy('agency.stats', {
            total: manageQuery.data.stats.total,
            submitted: manageQuery.data.stats.submitted,
            reviewing: manageQuery.data.stats.reviewing,
            accepted: manageQuery.data.stats.accepted,
            rejected: manageQuery.data.stats.rejected,
          })}
          {manageQuery.data.audition.processMode === 'MULTI_ROUND'
            ? ` · ${agencyCopy('agency.maxRoundSuffix', { n: manageQuery.data.maxRound })}`
            : ''}
        </Text>
      ) : null}
      <TextField label={agencyCopy('agency.numberSearch')} value={params.applicantNumber ?? ''} onChangeText={(value) => router.setParams({ applicantNumber: value || undefined })} keyboardType="number-pad" />
      {manageQuery.data ? <View style={styles.chips}>
        {[undefined, ...Array.from({ length: manageQuery.data.maxRound }, (_, i) => i + 1)].map((n) => <Pressable key={n ?? 'all'} accessibilityRole="button" onPress={() => router.setParams({ round: n ? String(n) : undefined })} style={[styles.chip, styles.roundChip, round === n && styles.chipOn]}>
          <Text style={styles.chipText}>{n ? agencyCopy('agency.roundApply', { n }) : agencyCopy('agency.all')}</Text>
        </Pressable>)}
      </View> : null}
      {manageQuery.isError ? (
        <ErrorState
          title={agencyCopy('common.loadFailedTitle')}
          message={agencyCopy('agency.loadFailed')}
          retryLabel={agencyCopy('common.retry')}
          onRetry={() => void manageQuery.refetch()}
        />
      ) : null}
      {(manageQuery.data?.items ?? []).map((item) => (
        <Pressable
          key={item.applicationId}
          onPress={() => router.push(`/agency/${item.applicationId}`)}
          style={styles.card}
          accessibilityRole="button"
        >
          <StatusPill label={agencyBoardStatusLabel(item.status, agencyCopy)} tone={toneForApplicationStatus(item.status)} />
          {item.applicantNumber ? <Text style={styles.number}>{agencyCopy(item.numberScopeRound ? 'agency.reviewNumber' : 'agency.receiptNumber', { n: item.applicantNumber, round: item.numberScopeRound ?? 0 })}</Text> : null}
          <Text style={styles.name}>{item.name || item.userName}</Text>
          <Text style={styles.meta}>
            {item.category} · {agencyCopy('agency.ageRoundVotes', { age: item.age ?? '-', round: item.round, votes: item.voteCount })}
          </Text>
        </Pressable>
      ))}
      {!manageQuery.isLoading && (manageQuery.data?.items.length ?? 0) === 0 ? <EmptyState title={agencyCopy('agency.empty')} /> : null}
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
  roundChip: { minHeight: 44, justifyContent: 'center' },
  number: { color: colors.purple, fontWeight: '800', fontSize: 14 },
  name: { fontWeight: '700', color: colors.text, fontSize: 16 },
})
