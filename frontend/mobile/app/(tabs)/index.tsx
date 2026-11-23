import { type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { auditionApi, auditionRecommendationsApi, publicPlatformApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import type { AuditionDto } from '../../src/api/types'
import { useAuth } from '../../src/auth/AuthProvider'
import type { PublicChannelRow } from '../../src/domain/channelCard'
import { useAudienceCountry } from '../../src/domain/AudienceCountryProvider'
import { HomeChannelCard } from '../../src/features/home/HomeChannelCard'
import { scriptLineHeight } from '../../src/i18n/typography'
import { AudienceFilter } from '../../src/ui/AudienceFilter'
import { AuditionCard } from '../../src/ui/AuditionCard'
import { EmptyState, ErrorState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { colors, radius } from '../../src/theme/tokens'

const HOME_LIMIT = 6

export default function HomeScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { country } = useAudienceCountry()
  const { isAuthenticated, session } = useAuth()

  const recommended = useQuery({
    queryKey: queryKeys.recommendations(country, HOME_LIMIT, session?.userId ?? null),
    queryFn: () => auditionRecommendationsApi.list(country, HOME_LIMIT),
  })
  const closingSoon = useQuery({
    queryKey: queryKeys.closingSoon(country, HOME_LIMIT),
    queryFn: () => auditionRecommendationsApi.closingSoon(country, HOME_LIMIT),
  })
  const latest = useQuery({
    queryKey: [...queryKeys.auditionsOpen(country, i18n.language), 'home-latest'],
    queryFn: () => auditionApi.listOpen(country),
  })
  const channels = useQuery({
    queryKey: ['home-channels', country],
    queryFn: async () => {
      const data = await publicPlatformApi.channels({
        country: country === 'ALL' ? undefined : country,
        sort: 'RECENT_ACTIVITY',
        limit: String(HOME_LIMIT),
        offset: '0',
      })
      return Array.isArray(data) ? (data as PublicChannelRow[]) : []
    },
  })

  const recItems = recommended.data?.items ?? []
  const closingItems = closingSoon.data ?? []
  const shownIds = new Set([...recItems.map((item) => item.audition.id), ...closingItems.map((row) => row.id)])
  const latestItems = (latest.data ?? []).filter((row) => !shownIds.has(row.id)).slice(0, HOME_LIMIT)
  const channelRows = (channels.data ?? []).filter((row) => row.userId).slice(0, HOME_LIMIT)
  const failed = recommended.isError && closingSoon.isError && latest.isError
  const recoTitle =
    isAuthenticated && recommended.data?.personalized ? t('recommend.title') : t('recommend.guestTitle')

  return (
    <Screen
      topInset={false}
      refreshing={recommended.isRefetching || closingSoon.isRefetching || latest.isRefetching || channels.isRefetching}
      onRefresh={() => {
        void recommended.refetch()
        void closingSoon.refetch()
        void latest.refetch()
        void channels.refetch()
      }}
    >
      <View style={styles.banner} testID="home-brand-banner">
        <Text style={styles.brand}>{t('home.brandName')}</Text>
        <Text style={[styles.tagline, { lineHeight: scriptLineHeight(i18n.language, 14, 20) }]}>{t('home.brandTagline')}</Text>
      </View>
      <AudienceFilter />
      {failed ? <ErrorState message={t('errors.generic')} onRetry={() => void recommended.refetch()} /> : null}

      <Section title={recoTitle} onSeeAll={() => router.push('/auditions')} seeAllLabel={t('home.seeAll')}>
        {recommended.isError ? <ErrorState message={t('errors.generic')} onRetry={() => void recommended.refetch()} /> : null}
        {recItems.length === 0 && !recommended.isPending ? <EmptyState title={t('auditions.empty')} /> : null}
        {recItems.map((item) => (
          <AuditionCard
            key={item.audition.id}
            audition={item.audition}
            variant="home"
            reasons={item.reasons}
            eligibility={item.eligibility}
            onPress={() => router.push(`/auditions/${item.audition.id}`)}
          />
        ))}
      </Section>

      {closingItems.length > 0 || closingSoon.isPending ? (
        <Section title={t('recommend.closingSoonTitle')} onSeeAll={() => router.push('/auditions')} seeAllLabel={t('home.seeAll')}>
          {closingItems.map((audition) => (
            <AuditionCard
              key={audition.id}
              audition={audition}
              variant="home"
              onPress={() => router.push(`/auditions/${audition.id}`)}
            />
          ))}
        </Section>
      ) : null}

      {channelRows.length > 0 || channels.isPending ? (
        <Section title={t('recommend.channelsTitle')} onSeeAll={() => router.push('/channels')} seeAllLabel={t('home.seeAll')}>
          {channelRows.map((row) => (
            <HomeChannelCard key={row.userId} row={row} onOpen={() => router.push(`/channel/${row.userId}`)} />
          ))}
        </Section>
      ) : null}

      <Section title={t('recommend.latestTitle')} onSeeAll={() => router.push('/auditions')} seeAllLabel={t('home.seeAll')}>
        {latestItems.length === 0 && !latest.isPending ? <EmptyState title={t('auditions.empty')} /> : null}
        {latestItems.map((audition: AuditionDto) => (
          <AuditionCard
            key={audition.id}
            audition={audition}
            variant="home"
            onPress={() => router.push(`/auditions/${audition.id}`)}
          />
        ))}
      </Section>
    </Screen>
  )
}

function Section({
  title,
  seeAllLabel,
  onSeeAll,
  children,
}: {
  title: string
  seeAllLabel: string
  onSeeAll: () => void
  children: ReactNode
}) {
  const { i18n } = useTranslation()
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { lineHeight: scriptLineHeight(i18n.language, 18, 24) }]}>{title}</Text>
        <Pressable onPress={onSeeAll} accessibilityRole="link" accessibilityLabel={seeAllLabel}>
          <Text style={styles.seeAll}>{seeAllLabel}</Text>
        </Pressable>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.heroStart,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 4,
  },
  brand: { fontSize: 20, fontWeight: '800', color: colors.purple, letterSpacing: 0.4 },
  tagline: { fontSize: 14, color: colors.text },
  section: { marginTop: 8, marginBottom: 16, gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  sectionTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 13, fontWeight: '600', color: colors.purple },
  sectionBody: { gap: 12 },
})
