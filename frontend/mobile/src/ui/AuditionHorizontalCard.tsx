import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { AuditionDto } from '../api/types'
import { auditionBadgeMeta } from '../domain/auditionBadges'
import { auditionHeadlineTitle, auditionListImageUrl } from '../domain/auditionImages'
import { colors, radius, space } from '../theme/tokens'
import { AuditionBadgeRow } from './Badges'
import { PosterImage } from './PosterImage'

const CARD_WIDTH = 260

export function AuditionHorizontalCard({ audition, onPress }: { audition: AuditionDto; onPress: () => void }) {
  const title = auditionHeadlineTitle(audition)
  const badges = auditionBadgeMeta(audition)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <PosterImage uri={auditionListImageUrl(audition.images)} compact />
      <View style={styles.body}>
        <AuditionBadgeRow {...badges} />
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {audition.agencyName ? (
          <Text style={styles.meta} numberOfLines={1}>
            {audition.agencyName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92 },
  body: {
    padding: space.sm,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    color: colors.textSecondary,
  },
})
