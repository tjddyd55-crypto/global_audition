import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { colors, radius, space } from '../theme/tokens'

type Props = {
  percent: number
}

export function ProfileCompletionBar({ percent }: Props) {
  const { t } = useTranslation()
  const clamped = Math.max(0, Math.min(100, percent))

  return (
    <View style={styles.wrap} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: clamped }}>
      <View style={styles.head}>
        <Text style={styles.label}>{t('profile.manageTitle')}</Text>
        <Text style={styles.value}>{clamped}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs, marginBottom: space.md },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: colors.text },
  value: { fontSize: 14, fontWeight: '700', color: colors.purple },
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
