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
import { useTranslation } from 'react-i18next'
import { audienceCountryFromLocale } from '../../src/domain/audience'
import { getRuntimeLocale } from '../../src/i18n/runtime'

export default function HomeScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { isAuthenticated, session } = useAuth()
  const country = audienceCountryFromLocale(getRuntimeLocale())
  const auditionsQuery = useQuery({
    queryKey: queryKeys.auditionsOpen(country),
    queryFn: () => auditionApi.listOpen(country),
  })
  const dashQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.applicant,
    enabled: isAuthenticated,
  })

  return (
    <Screen refreshing={auditionsQuery.isFetching} onRefresh={() => void auditionsQuery.refetch()}>
      <LinearGradient colors={[colors.heroStart, colors.surface]} style={styles.hero}>
        <Text style={styles.kicker}>{t('home.kicker')}</Text>
        <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
        <Text style={styles.heroBody}>{t('home.heroBody')}</Text>
        <Button label={t('home.browse')} onPress={() => router.push('/(tabs)/auditions')} />
      </LinearGradient>

      {isAuthenticated && dashQuery.data ? (
        <View style={styles.stats}>
          <Stat label={t('home.applied')} value={dashQuery.data.applied} />
          <Stat label={t('home.reviewing')} value={dashQuery.data.reviewed} />
          <Stat label={t('home.accepted')} value={dashQuery.data.accepted} />
          <Stat label={t('home.rejected')} value={dashQuery.data.rejected} />
        </View>
      ) : null}

      <Text style={styles.section}>{t('home.openAuditions')}</Text>
      {auditionsQuery.isError ? (
        <ErrorState message={t('home.loadFailed')} onRetry={() => void auditionsQuery.refetch()} />
      ) : null}
      {(auditionsQuery.data ?? []).slice(0, 5).map((audition) => (
        <View key={audition.id} style={styles.gap}>
          <AuditionCard audition={audition} onPress={() => router.push(`/auditions/${audition.id}`)} />
        </View>
      ))}
      {!auditionsQuery.isLoading && (auditionsQuery.data?.length ?? 0) === 0 ? (
        <EmptyState title={t('auditions.empty')} body={t('home.emptyBody')} />
      ) : null}

      {!isAuthenticated ? (
        <View style={styles.authCue}>
          <Text style={styles.meta}>{session?.nickname ?? t('home.loginCue')}</Text>
          <Button label={t('common.login')} variant="secondary" onPress={() => router.push('/(auth)/login')} />
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
