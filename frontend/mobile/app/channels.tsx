import { useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Image, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native'
import { useTranslation } from 'react-i18next'
import { publicPlatformApi } from '../src/api/endpoints'
import { channelCardView, type ChannelCardView, type PublicChannelRow } from '../src/domain/channelCard'
import { AUDIENCE_FILTER_OPTIONS } from '../src/domain/audience'
import { formatCount } from '../src/i18n/format'
import { Button } from '../src/ui/Button'
import { ChannelMetaLine } from '../src/ui/ChannelMetaLine'
import { EmptyState, ErrorState } from '../src/ui/EmptyState'
import { Screen } from '../src/ui/Screen'
import { ScrollChipRow } from '../src/ui/ScrollChipRow'
import { colors, radius } from '../src/theme/tokens'
import { CHANNEL_FIELD_FILTERS, CHANNEL_PAGE_SIZE, CHANNEL_SORTS } from '../../web/src/shared/channel/discovery'

/** 채널 탭: 검색 + 국가/분야 가로 칩(선택 칩 자동 스크롤) + 정렬 칩 + 1열 목록. 지표는 실제 값만. */
export default function ChannelsScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const [stageName, setStageName] = useState('')
  const [q, setQ] = useState('')
  const [country, setCountry] = useState('ALL')
  const [field, setField] = useState('ALL')
  const [sort, setSort] = useState<string>('NEWEST')

  useEffect(() => {
    const id = setTimeout(() => setQ(stageName.trim()), 300)
    return () => clearTimeout(id)
  }, [stageName])

  const query = useInfiniteQuery({
    queryKey: ['public-channels', q, country, field, sort],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const data = await publicPlatformApi.channels({
        q: q || undefined,
        country: country === 'ALL' ? undefined : country,
        field: field === 'ALL' ? undefined : field,
        sort,
        limit: String(CHANNEL_PAGE_SIZE),
        offset: String(pageParam),
      })
      return Array.isArray(data) ? (data as PublicChannelRow[]) : []
    },
    getNextPageParam: (last, pages) => (last.length < CHANNEL_PAGE_SIZE ? undefined : pages.reduce((n, p) => n + p.length, 0)),
  })
  const rows = query.data?.pages.flat() ?? []
  const fallbacks = { name: t('channel.nameFallback'), intro: t('channel.descFallback') }
  const cards = rows.filter((row) => row.userId).map((row) => channelCardView(row, fallbacks))
  const filtered = q !== '' || country !== 'ALL' || field !== 'ALL'
  return (
    <Screen topInset={false} refreshing={query.isRefetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>{t('common.channels')}</Text>
      <TextInput
        value={stageName}
        onChangeText={setStageName}
        placeholder={t('channel.searchPlaceholder')}
        accessibilityLabel={t('channel.searchPlaceholder')}
        style={styles.search}
        returnKeyType="search"
        testID="channel-search"
      />
      <View style={styles.filters}>
        <ScrollChipRow
          testID="channel-country-chips"
          accessibilityLabel={t('channel.countryFilter')}
          options={AUDIENCE_FILTER_OPTIONS}
          selected={country}
          onSelect={setCountry}
          labelOf={(c) => (c === 'ALL' ? t('auditions.filterAll') : t(`country.${c}`))}
        />
        <ScrollChipRow
          testID="channel-field-chips"
          accessibilityLabel={t('channel.fieldFilter')}
          options={CHANNEL_FIELD_FILTERS}
          selected={field}
          onSelect={setField}
          labelOf={(f) => (f === 'ALL' ? t('channel.allCategories') : f === 'OTHER' ? t('channel.fieldOther') : t(`recruitField.${f}`))}
        />
        <ScrollChipRow
          testID="channel-sort-chips"
          accessibilityLabel={t('channel.sortLabel')}
          options={CHANNEL_SORTS}
          selected={sort}
          onSelect={setSort}
          labelOf={(s) => t(`channel.sort.${s}`)}
        />
      </View>
      {query.isError ? <ErrorState message={t('channel.listLoadFailed')} onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && cards.length === 0 ? (
        <EmptyState title={filtered ? t('channel.noResults') : t('channel.listEmpty')} />
      ) : null}
      {cards.map((card) => (
        <ChannelRow key={card.userId} card={card} language={i18n.language} onOpen={() => router.push(`/channel/${card.userId}`)} />
      ))}
      {query.hasNextPage ? (
        <Button label={t('channel.loadMore')} variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
      ) : null}
    </Screen>
  )
}

function ChannelRow({ card, onOpen, language }: { card: ChannelCardView; onOpen: () => void; language: string }) {
  const { t } = useTranslation()
  const [avatarFailed, setAvatarFailed] = useState(false)
  const { width } = useWindowDimensions()
  const showAvatar = Boolean(card.avatarUri) && !avatarFailed
  return (
    <Pressable style={styles.card} onPress={onOpen} accessibilityRole="button" accessibilityLabel={card.name} testID="channel-card">
      {showAvatar ? (
        <Image source={{ uri: card.avatarUri ?? '' }} style={styles.avatar} onError={() => setAvatarFailed(true)} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{card.initial}</Text>
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {card.name}
        </Text>
        <ChannelMetaLine nationality={card.nationality} residence={card.residence} mainField={card.mainField} />
        <Text style={[styles.intro, !card.hasIntro && styles.introHint]} numberOfLines={1}>
          {card.intro}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {t('channel.cardStats', { followers: formatCount(card.subscribers, language), videos: formatCount(card.videos, language) })}
        </Text>
      </View>
      {card.thumbUri && width >= 360 ? <Image source={{ uri: card.thumbUri }} style={styles.thumb} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginTop: 12, marginBottom: 8 },
  filters: { gap: 8, marginBottom: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 12,
    marginBottom: 10,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f1f1f4' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.heroStart },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: colors.purple },
  text: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  intro: { fontSize: 13, lineHeight: 19, color: colors.text },
  introHint: { color: colors.muted, fontStyle: 'italic' },
  meta: { fontSize: 12, color: colors.muted },
  thumb: { width: 80, height: 45, borderRadius: 6, backgroundColor: '#111' },
})
