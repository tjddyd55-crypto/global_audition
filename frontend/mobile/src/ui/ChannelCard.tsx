import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { PublicChannelListItem } from '../api/channel'
import { narrow } from '../theme/narrow'
import { colors, radius, space } from '../theme/tokens'

type Props = {
  item: PublicChannelListItem
  onPress: () => void
}

export function ChannelCard({ item, onPress }: Props) {
  const { t } = useTranslation()

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {item.profileImage ? (
        <Image source={{ uri: item.profileImage }} style={styles.avatar} accessibilityIgnoresInvertColors />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.initial}>{item.nickname.slice(0, 1).toUpperCase() || '?'}</Text>
        </View>
      )}
      <View style={narrow.shrink}>
        <Text style={styles.name} numberOfLines={1}>{item.nickname}</Text>
        {item.introText ? <Text style={styles.meta} numberOfLines={2}>{item.introText}</Text> : null}
        <Text style={styles.meta}>
          {t('channel.subscribersVideos', { subs: item.subscriberCount, videos: item.videoCount })}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space.md,
    marginBottom: space.sm,
    alignItems: 'center',
  },
  pressed: { opacity: 0.92 },
  avatar: { width: 56, height: 56, borderRadius: 28, flexShrink: 0 },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.heroStart,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  initial: { fontSize: 22, fontWeight: '800', color: colors.purple },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: 2 },
})
