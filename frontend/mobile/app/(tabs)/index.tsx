import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import type { AuditionDto } from '../../src/api/types'
import { auditionApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { sortAuditionsByPopular, sortAuditionsByRecent } from '../../src/domain/auditionLists'
import { AuditionHorizontalCard } from '../../src/ui/AuditionHorizontalCard'
import { Button } from '../../src/ui/Button'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { HomeBanner } from '../../src/ui/HomeBanner'
import { Screen } from '../../src/ui/Screen'
import { ScreenHeaderActions } from '../../src/ui/ScreenHeaderActions'
import { SectionHeader } from '../../src/ui/SectionHeader'
import { colors, space, touch } from '../../src/theme/tokens'
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
        <ScreenHeaderActions>
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
        </ScreenHeaderActions>
      </View>

      <HomeBanner onPress={() => router.push('/(tabs)/auditions')} />

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
  discovery: { marginBottom: space.lg },
  hScroll: { gap: space.sm, paddingRight: space.md },
  hCardGap: { marginRight: space.xs },
  authCue: { marginTop: space.md, gap: space.sm },
  meta: { color: colors.muted, fontSize: 14 },
  pressed: { opacity: 0.88 },
})
