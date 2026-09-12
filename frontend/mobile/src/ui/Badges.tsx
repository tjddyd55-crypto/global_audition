import { StyleSheet, Text, View } from 'react-native'
import { badge, colors, radius } from '../theme/tokens'

type BadgeProps = {
  label: string
  accessibilityLabel?: string
}

function BadgeBase({
  label,
  backgroundColor,
  color,
  accessibilityLabel,
}: BadgeProps & { backgroundColor: string; color: string }) {
  return (
    <View
      style={[styles.badge, { backgroundColor }]}
      accessibilityRole="text"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

export function StatusBadge({ label, accessibilityLabel }: BadgeProps) {
  return <BadgeBase label={label} backgroundColor={colors.statusOpenBg} color={colors.statusOpenText} accessibilityLabel={accessibilityLabel} />
}

export function RoundBadge({ label, accessibilityLabel }: BadgeProps) {
  return <BadgeBase label={label} backgroundColor={colors.roundBg} color={colors.roundText} accessibilityLabel={accessibilityLabel} />
}

export function DdayChip({ label, accessibilityLabel }: BadgeProps) {
  return <BadgeBase label={label} backgroundColor={colors.ddayBg} color={colors.ddayText} accessibilityLabel={accessibilityLabel} />
}

export function AuditionBadgeRow({
  statusLabel,
  roundLabel,
  ddayLabel,
}: {
  statusLabel?: string | null
  roundLabel?: string | null
  ddayLabel?: string | null
}) {
  const hasStatus = Boolean(statusLabel?.trim())
  const hasRound = Boolean(roundLabel?.trim())
  const hasDday = Boolean(ddayLabel?.trim())
  if (!hasStatus && !hasRound && !hasDday) return null
  return (
    <View style={styles.row}>
      {hasStatus ? <StatusBadge label={statusLabel!.trim()} /> : null}
      {hasRound ? <RoundBadge label={roundLabel!.trim()} /> : null}
      {hasDday ? <DdayChip label={ddayLabel!.trim()} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    height: badge.height,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  text: {
    fontSize: badge.fontSize,
    fontWeight: '700',
    flexShrink: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
})
