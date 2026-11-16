import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { publicPlatformApi } from '../src/api/endpoints'
import { channelCardView, type ChannelCardView, type PublicChannelRow } from '../src/domain/channelCard'
import { Button } from '../src/ui/Button'
import { EmptyState, ErrorState } from '../src/ui/EmptyState'
import { Screen } from '../src/ui/Screen'
import { colors, radius } from '../src/theme/tokens'
import { useTranslation } from 'react-i18next'

export default function ChannelsScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [stageName, setStageName] = useState('')
  const query = useQuery({
    queryKey: ['public-channels', stageName],
    queryFn: () => publicPlatformApi.channels(stageName ? { q: stageName } : undefined),
  })
  const rows = Array.isArray(query.data) ? (query.data as PublicChannelRow[]) : []
  const fallbacks = { name: t('channel.nameFallback'), intro: t('channel.descFallback') }
  const cards = rows.filter((row) => row.userId).map((row) => channelCardView(row, fallbacks))
  const open = (userId: string) => router.push(`/channel/${userId}`)
  return (
    <Screen topInset={false} refreshing={query.isFetching} onRefresh={() => void query.refetch()}>
      <Text style={styles.title}>{t('common.channels')}</Text>
      <TextInput
        value={stageName}
        onChangeText={setStageName}
        placeholder={t('channel.stageName')}
        style={styles.search}
      />
      {query.isError ? <ErrorState message={t('channel.listLoadFailed')} onRetry={() => void query.refetch()} /> : null}
      {!query.isLoading && !query.isError && cards.length === 0 ? <EmptyState title={t('channel.listEmpty')} /> : null}
      {cards.map((card) => (
        <ChannelCard key={card.userId} card={card} onOpen={() => open(card.userId)} />
      ))}
    </Screen>
  )
}

function ChannelCard({ card, onOpen }: { card: ChannelCardView; onOpen: () => void }) {
  const { t } = useTranslation()
  const [avatarFailed, setAvatarFailed] = useState(false)
  const showAvatar = Boolean(card.avatarUri) && !avatarFailed
  return (
    <View style={styles.card} testID="channel-card">
      <Pressable style={styles.head} onPress={onOpen} accessibilityRole="button" accessibilityLabel={card.name}>
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
          <Text style={[styles.intro, !card.hasIntro && styles.introHint]} numberOfLines={2}>
            {card.intro}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {t('channel.subscribersVideos', { subs: card.subscribers.toLocaleString(), videos: card.videos.toLocaleString() })}
          </Text>
        </View>
      </Pressable>
      <Button label={t('channel.viewCta')} variant="secondary" onPress={onOpen} />
    </View>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, marginVertical: 12 },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 14,
    gap: 12,
    marginBottom: 12,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#f1f1f4' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.heroStart },
  avatarInitial: { fontSize: 22, fontWeight: '800', color: colors.purple },
  text: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  intro: { fontSize: 13, lineHeight: 19, color: colors.text },
  introHint: { color: colors.muted, fontStyle: 'italic' },
  meta: { fontSize: 12, color: colors.muted },
})
