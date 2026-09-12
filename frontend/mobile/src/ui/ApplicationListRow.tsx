import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import type { MyApplicationListItem } from '../api/types'
import { applicationResultCopy, applicationStatusLabel } from '../domain/statusLabels'
import { formatLocaleDate } from '../i18n/format'
import { narrow } from '../theme/narrow'
import { colors, radius, space } from '../theme/tokens'
import { StatusPill, toneForApplicationStatus } from './StatusPill'

type Props = {
  item: MyApplicationListItem
  onPress: () => void
}

export function ApplicationListRow({ item, onPress }: Props) {
  const { t } = useTranslation()
  const dateLabel = item.createdAt ? formatLocaleDate(item.createdAt) : '—'

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.auditionTitle}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <StatusPill label={applicationStatusLabel(item.status)} tone={toneForApplicationStatus(item.status)} />
        <Text style={styles.date}>{t('myApplications.appliedOn', { date: dateLabel })}</Text>
      </View>
      <Text style={styles.title} numberOfLines={2}>{item.auditionTitle}</Text>
      <Text style={styles.meta} numberOfLines={2}>{applicationResultCopy(item.status)}</Text>
      <Text style={styles.link}>{t('myApplications.detail')} →</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.card,
    padding: space.md,
    gap: space.xs,
    marginBottom: space.sm,
  },
  pressed: { opacity: 0.92 },
  top: { ...narrow.row, justifyContent: 'space-between' },
  date: { fontSize: 12, color: colors.faint, flexShrink: 0 },
  title: { fontSize: 16, fontWeight: '700', color: colors.text, ...narrow.shrink },
  meta: { fontSize: 13, color: colors.muted, lineHeight: 20, ...narrow.shrink },
  link: { fontSize: 13, fontWeight: '600', color: colors.purple, marginTop: 4 },
})
