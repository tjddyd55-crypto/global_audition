import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { AuditionDto } from '../api/types'
import { auditionBadgeMeta } from '../domain/auditionBadges'
import { auditionHeadlineTitle, auditionListImageUrl } from '../domain/auditionImages'
import { colors, radius, space } from '../theme/tokens'
import { AuditionBadgeRow } from './Badges'
import { PosterImage } from './PosterImage'

export function AuditionCard({ audition, onPress }: { audition: AuditionDto; onPress: () => void }) {
  const { t } = useTranslation()
  const title = auditionHeadlineTitle(audition)
  const badges = auditionBadgeMeta(audition)

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <PosterImage uri={auditionListImageUrl(audition.images)} />
      <View style={styles.body}>
        <AuditionBadgeRow {...badges} />
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {audition.agencyName ? <Text style={styles.meta} numberOfLines={1}>{audition.agencyName}</Text> : null}
        <Text style={styles.faint}>
          {t('common.applicantsCount', { n: audition.applicantsCount })} · {t('common.daysLeftCount', { n: audition.remainingDays })}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.92 },
  body: { padding: space.md, gap: space.xs },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  faint: { fontSize: 12, color: colors.faint },
})
