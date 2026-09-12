import { StyleSheet, Text, View } from 'react-native'
import { badge, colors, radius } from '../theme/tokens'

type Tone = 'success' | 'danger' | 'info' | 'warn' | 'neutral'

const TONE: Record<Tone, { bg: string; fg: string }> = {
  success: { bg: colors.successBg, fg: colors.successText },
  danger: { bg: colors.dangerBg, fg: colors.dangerText },
  info: { bg: colors.infoBg, fg: colors.infoText },
  warn: { bg: colors.warnBg, fg: colors.warnText },
  neutral: { bg: '#f3f4f6', fg: '#374151' },
}

export function toneForApplicationStatus(status: string): Tone {
  if (status === 'ACCEPTED' || status === 'APPROVED' || status === 'PASSED' || status === 'FINAL_PASSED') return 'success'
  if (status === 'REJECTED' || status === 'FAILED' || status === 'FINAL_FAILED') return 'danger'
  if (status === 'REVIEWING' || status === 'REVIEWED' || status === 'UNDER_REVIEW') return 'info'
  if (status === 'OPEN') return 'success'
  if (status === 'CLOSED') return 'neutral'
  return 'warn'
}

export function StatusPill({ label, tone }: { label: string; tone: Tone }) {
  const palette = TONE[tone]
  return (
    <View style={[styles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.fg }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    minHeight: badge.height,
    justifyContent: 'center',
  },
  text: {
    fontSize: badge.fontSize,
    fontWeight: '700',
  },
})
