import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { ChannelVideoBrowseItem } from '../api/channelVideo'
import { resolveVideoThumbnailUrl } from '../domain/videoThumbnail'
import { formatRelativeTime } from '../i18n/format'
import { narrow } from '../theme/narrow'
import { colors, radius, space } from '../theme/tokens'
import { useTranslation } from 'react-i18next'

type Props = {
  item: ChannelVideoBrowseItem
  onPress: () => void
}

export function VideoListRow({ item, onPress }: Props) {
  const { t } = useTranslation()
  const thumb = resolveVideoThumbnailUrl(item.videoUrl, item.thumbnailUrl)

  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.thumbWrap}>
        {thumb ? <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" accessibilityIgnoresInvertColors /> : <View style={styles.thumbPlaceholder} />}
      </View>
      <View style={narrow.shrink}>
        <Text style={styles.title} numberOfLines={2}>{item.title || t('video.titleFallback')}</Text>
        <Text style={styles.meta} numberOfLines={1}>{item.channelDisplayName}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {t('video.viewsCount', { n: item.viewCount })}
          {item.publishedAt ? ` · ${formatRelativeTime(item.publishedAt)}` : ''}
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
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.sm,
    marginBottom: space.sm,
  },
  pressed: { opacity: 0.92 },
  thumbWrap: { width: 120, flexShrink: 0 },
  thumb: { width: 120, aspectRatio: 16 / 9, borderRadius: radius.chip },
  thumbPlaceholder: { width: 120, aspectRatio: 16 / 9, borderRadius: radius.chip, backgroundColor: colors.heroStart },
  title: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  meta: { fontSize: 12, color: colors.muted, lineHeight: 18 },
})
