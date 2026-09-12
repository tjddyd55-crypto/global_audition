import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { AuditionDto } from '../api/types'
import { auditionBadgeMeta } from '../domain/auditionBadges'
import { auditionHeadlineTitle, auditionListImageUrl } from '../domain/auditionImages'
import { colors, radius, space } from '../theme/tokens'
import { AuditionBadgeRow } from './Badges'
import { PosterImage } from './PosterImage'

export function AuditionListRow({ audition, onPress }: { audition: AuditionDto; onPress: () => void }) {
  const { t } = useTranslation()
  const title = auditionHeadlineTitle(audition)
  const badges = auditionBadgeMeta(audition)
  const metaLine = [audition.agencyName, audition.location].filter(Boolean).join(' · ')

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <PosterImage uri={auditionListImageUrl(audition.images)} thumbnail />
      <View style={styles.body}>
        <AuditionBadgeRow {...badges} />
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {metaLine ? <Text style={styles.meta} numberOfLines={1}>{metaLine}</Text> : null}
        <Text style={styles.faint}>
          {t('common.applicantsCount', { n: audition.applicantsCount })}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    gap: space.sm,
    padding: space.sm,
  },
  pressed: { opacity: 0.92 },
  body: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 21,
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  faint: {
    fontSize: 12,
    color: colors.faint,
  },
})
