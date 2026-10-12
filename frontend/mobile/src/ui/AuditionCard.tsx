import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { AuditionDto } from '../api/types'
import { auditionHeadlineTitle, auditionListImageUrl } from '../domain/auditionImages'
import { auditionStatusLabel } from '../domain/statusLabels'
import { colors, radius } from '../theme/tokens'
import { PosterImage } from './PosterImage'
import { StatusPill, toneForApplicationStatus } from './StatusPill'

export function AuditionCard({ audition, onPress }: { audition: AuditionDto; onPress: () => void }) {
  const title = auditionHeadlineTitle(audition)
  const label = auditionStatusLabel(audition.status, audition.recruitmentRoundLabel)
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <PosterImage uri={auditionListImageUrl(audition.images)} />
      <View style={styles.body}>
        <StatusPill label={label} tone={toneForApplicationStatus(audition.status)} />
        <Text style={styles.title}>{title}</Text>
        {audition.agencyName ? <Text style={styles.meta}>{audition.agencyName}</Text> : null}
        <Text style={styles.meta} numberOfLines={2}>
          {audition.description}
        </Text>
        <Text style={styles.faint}>
          지원 {audition.applicantsCount} · 남은 일 {audition.remainingDays}
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
  body: { padding: 16, gap: 8 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 20 },
  faint: { fontSize: 12, color: colors.faint },
})
