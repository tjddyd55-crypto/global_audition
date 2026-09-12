import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { AuditionDto } from '../../src/api/types'
import { auditionApi, dashboardApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { sortAuditionsByPopular, sortAuditionsByRecent } from '../../src/domain/auditionLists'
import { AuditionHorizontalCard } from '../../src/ui/AuditionHorizontalCard'
import { Button } from '../../src/ui/Button'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { SectionHeader } from '../../src/ui/SectionHeader'
import { colors, radius, space, touch } from '../../src/theme/tokens'
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

  const auditions = useMemo(() => auditionsQuery.data ?? [], [auditionsQuery.data])
  const featured = useMemo(() => auditions.slice(0, 5), [auditions])
  const recommended = useMemo(() => sortAuditionsByPopular(auditions).slice(0, 5), [auditions])
  const recent = useMemo(() => sortAuditionsByRecent(auditions).slice(0, 5), [auditions])

  const displayName = session?.nickname || session?.displayName || session?.name || session?.email || ''

  return (
    <Screen refreshing={auditionsQuery.isFetching} onRefresh={() => void auditionsQuery.refetch()}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>
            {isAuthenticated && displayName ? t('home.greeting', { name: displayName }) : t('home.greetingGuest')}
          </Text>
          <Text style={styles.subtitle}>{t('home.heroBody')}</Text>
        </View>
        <Pressable
          onPress={() => router.push(isAuthenticated ? '/(tabs)/profile' : '/(auth)/login')}
          accessibilityRole="button"
          accessibilityLabel={t('common.myAccount')}
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
        >
          {session?.profileImageUrl ? (
            <Image source={{ uri: session.profileImageUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarInitial}>{(displayName || '?').slice(0, 1).toUpperCase()}</Text>
          )}
        </Pressable>
      </View>

      {isAuthenticated && dashQuery.data ? (
        <View style={styles.stats}>
          <StatTile label={t('home.applied')} value={dashQuery.data.applied} onPress={() => router.push('/(tabs)/applications')} />
          <StatTile label={t('home.reviewing')} value={dashQuery.data.reviewed} onPress={() => router.push('/(tabs)/applications')} />
          <StatTile label={t('home.accepted')} value={dashQuery.data.accepted} onPress={() => router.push('/(tabs)/applications')} />
          <StatTile label={t('home.votes')} onPress={() => router.push('/(tabs)/vote')} />
        </View>
      ) : null}

      <Text style={styles.sectionLabel}>{t('home.quickActions')}</Text>
      <View style={styles.quickGrid}>
        <QuickAction label={t('nav.vote')} onPress={() => router.push('/(tabs)/vote')} />
        <QuickAction label={t('common.ranking')} onPress={() => router.push('/(tabs)/auditions')} />
        <QuickAction label={t('nav.applications')} onPress={() => router.push('/(tabs)/applications')} />
        <QuickAction label={t('common.videos')} onPress={() => router.push('/web')} />
      </View>

      {auditionsQuery.isError ? (
        <ErrorState message={t('home.loadFailed')} onRetry={() => void auditionsQuery.refetch()} />
      ) : null}

      {!auditionsQuery.isLoading && auditions.length === 0 ? (
        <EmptyState title={t('auditions.empty')} body={t('home.emptyBody')} />
      ) : null}

      {featured.length > 0 ? (
        <DiscoverySection
          title={t('home.featured')}
          actionLabel={t('home.seeAll')}
          onAction={() => router.push('/(tabs)/auditions')}
          auditions={featured}
          onCardPress={(id) => router.push(`/auditions/${id}`)}
        />
      ) : null}

      {recommended.length > 0 ? (
        <DiscoverySection
          title={t('home.recommended')}
          actionLabel={t('home.seeAll')}
          onAction={() => router.push('/(tabs)/auditions')}
          auditions={recommended}
          onCardPress={(id) => router.push(`/auditions/${id}`)}
        />
      ) : null}

      {recent.length > 0 ? (
        <DiscoverySection
          title={t('home.recent')}
          actionLabel={t('home.seeAll')}
          onAction={() => router.push('/(tabs)/auditions')}
          auditions={recent}
          onCardPress={(id) => router.push(`/auditions/${id}`)}
        />
      ) : null}

      {!isAuthenticated ? (
        <View style={styles.authCue}>
          <Text style={styles.meta}>{t('home.loginCue')}</Text>
          <Button label={t('common.login')} variant="secondary" onPress={() => router.push('/(auth)/login')} />
        </View>
      ) : null}
    </Screen>
  )
}

function StatTile({
  label,
  value,
  onPress,
}: {
  label: string
  value?: number
  onPress: () => void
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.stat, pressed && styles.pressed]}
    >
      <Text style={styles.statValue}>{value != null ? value : '—'}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>{label}</Text>
    </Pressable>
  )
}

function QuickAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <Text style={styles.quickLabel} numberOfLines={2}>{label}</Text>
    </Pressable>
  )
}

function DiscoverySection({
  title,
  actionLabel,
  onAction,
  auditions,
  onCardPress,
}: {
  title: string
  actionLabel: string
  onAction: () => void
  auditions: AuditionDto[]
  onCardPress: (id: string) => void
}) {
  return (
    <View style={styles.discovery}>
      <SectionHeader title={title} actionLabel={actionLabel} onAction={onAction} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
        {auditions.map((audition) => (
          <View key={audition.id} style={styles.hCardGap}>
            <AuditionHorizontalCard audition={audition} onPress={() => onCardPress(audition.id)} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginBottom: space.md,
  },
  headerText: { flex: 1, gap: 4 },
  greeting: { fontSize: 22, fontWeight: '800', color: colors.text, lineHeight: 28 },
  subtitle: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  avatar: {
    width: touch.min,
    height: touch.min,
    borderRadius: touch.min / 2,
    backgroundColor: colors.heroStart,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarImage: { width: touch.min, height: touch.min, borderRadius: touch.min / 2 },
  avatarInitial: { fontSize: 18, fontWeight: '800', color: colors.purple },
  stats: { flexDirection: 'row', gap: space.xs, marginBottom: space.lg },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: touch.min,
    justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: space.xs },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    marginBottom: space.lg,
  },
  quickAction: {
    width: '48%',
    flexGrow: 1,
    minHeight: touch.min,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  quickLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  discovery: { marginBottom: space.lg },
  hScroll: { gap: space.sm, paddingRight: space.md },
  hCardGap: { marginRight: space.xs },
  authCue: { marginTop: space.md, gap: space.sm },
  meta: { color: colors.muted, fontSize: 14 },
  pressed: { opacity: 0.88 },
})
