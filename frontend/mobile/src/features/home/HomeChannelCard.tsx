import { useState } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { channelCardView, type PublicChannelRow } from '../../domain/channelCard'
import { ChannelMetaLine } from '../../ui/ChannelMetaLine'
import { colors, radius } from '../../theme/tokens'
import { scriptLineHeight } from '../../i18n/typography'

/** 홈 추천 인재 채널 카드. 팔로워·조회수는 실제 값이 없어도 가짜로 만들지 않으며, 홈에서는 생략한다. */
export function HomeChannelCard({ row, onOpen }: { row: PublicChannelRow; onOpen: () => void }) {
  const { t, i18n } = useTranslation()
  const [avatarFailed, setAvatarFailed] = useState(false)
  const [thumbFailed, setThumbFailed] = useState(false)
  const card = channelCardView(row, { name: t('channel.nameFallback'), intro: t('channel.descFallback') })
  const showAvatar = Boolean(card.avatarUri) && !avatarFailed
  const showThumb = Boolean(card.thumbUri) && !thumbFailed
  return (
    <Pressable
      style={styles.card}
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={card.name}
      testID="home-channel-card"
    >
      {showAvatar ? (
        <Image source={{ uri: card.avatarUri ?? '' }} style={styles.avatar} onError={() => setAvatarFailed(true)} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{card.initial}</Text>
        </View>
      )}
      <View style={styles.text}>
        <Text style={[styles.name, { lineHeight: scriptLineHeight(i18n.language, 15, 21) }]} numberOfLines={1}>
          {card.name}
        </Text>
        <ChannelMetaLine nationality={card.nationality} residence={card.residence} mainField={card.mainField} />
      </View>
      {showThumb ? <Image source={{ uri: card.thumbUri ?? '' }} style={styles.thumb} onError={() => setThumbFailed(true)} /> : null}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: 12,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#f1f1f4' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.heroStart },
  avatarInitial: { fontSize: 18, fontWeight: '800', color: colors.purple },
  text: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 15, fontWeight: '700', color: colors.text },
  thumb: { width: 80, height: 45, borderRadius: 6, backgroundColor: '#111' },
})
