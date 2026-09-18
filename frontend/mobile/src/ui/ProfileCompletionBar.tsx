import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius, space } from '../theme/tokens'

type Props = {
  percent: number
  /** Inline variant for profile header (no outer margin). */
  compact?: boolean
}

export function ProfileCompletionBar({ percent, compact }: Props) {
  const { t } = useTranslation()
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <View
      style={[styles.wrap, compact && styles.wrapCompact]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: clamped }}
    >
      <Text style={styles.label}>{t('profile.completionLabel', { percent: clamped })}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs, marginBottom: space.md },
  wrapCompact: { marginBottom: 0, marginTop: space.xs },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.heroStart,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.purple,
  },
})
