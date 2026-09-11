import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { auditionApi, dashboardApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { AuditionCard } from '../../src/ui/AuditionCard'
import { Button } from '../../src/ui/Button'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { colors, radius } from '../../src/theme/tokens'

export default function HomeScreen() {
  const router = useRouter()
  const { isAuthenticated, session } = useAuth()
  const auditionsQuery = useQuery({ queryKey: queryKeys.auditionsOpen, queryFn: auditionApi.listOpen })
  const dashQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.applicant,
    enabled: isAuthenticated,
  })

  return (
    <Screen>
      <LinearGradient colors={[colors.heroStart, colors.surface]} style={styles.hero}>
        <Text style={styles.kicker}>GLOBAL AUDITION</Text>
        <Text style={styles.heroTitle}>기획사와 지망생을 잇는{'\n'}글로벌 오디션</Text>
        <Text style={styles.heroBody}>모집중인 오디션을 보고, 영상 링크로 지원하고, 라운드 결과를 확인하세요.</Text>
        <Button label="오디션 둘러보기" onPress={() => router.push('/(tabs)/auditions')} />
      </LinearGradient>

      {isAuthenticated && dashQuery.data ? (
        <View style={styles.stats}>
          <Stat label="지원" value={dashQuery.data.applied} />
          <Stat label="검토중" value={dashQuery.data.reviewed} />
          <Stat label="합격" value={dashQuery.data.accepted} />
          <Stat label="불합격" value={dashQuery.data.rejected} />
        </View>
      ) : null}

      <Text style={styles.section}>모집중인 오디션</Text>
      {auditionsQuery.isError ? (
        <ErrorState message="오디션 목록을 불러오지 못했습니다." onRetry={() => void auditionsQuery.refetch()} />
      ) : null}
      {(auditionsQuery.data ?? []).slice(0, 5).map((audition) => (
        <View key={audition.id} style={styles.gap}>
          <AuditionCard audition={audition} onPress={() => router.push(`/auditions/${audition.id}`)} />
        </View>
      ))}
      {!auditionsQuery.isLoading && (auditionsQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title="현재 모집중인 오디션이 없습니다" body="새로운 공고가 열리면 여기에 표시됩니다." />
      ) : null}

      {!isAuthenticated ? (
        <View style={styles.authCue}>
          <Text style={styles.meta}>{session?.nickname ?? '로그인하면 지원과 투표를 이어갈 수 있습니다.'}</Text>
          <Button label="로그인" variant="secondary" onPress={() => router.push('/(auth)/login')} />
        </View>
      ) : null}
    </Screen>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  hero: { borderRadius: radius.card, padding: 20, gap: 12, marginBottom: 16 },
  kicker: { color: colors.purple, fontWeight: '800', letterSpacing: 0.6 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: colors.text, lineHeight: 32 },
  heroBody: { fontSize: 14, color: colors.muted, lineHeight: 22 },
  stats: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.border },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  section: { fontSize: 18, fontWeight: '700', marginBottom: 12, color: colors.text },
  gap: { marginBottom: 12 },
  authCue: { marginTop: 16, gap: 10 },
  meta: { color: colors.muted, fontSize: 14 },
})
