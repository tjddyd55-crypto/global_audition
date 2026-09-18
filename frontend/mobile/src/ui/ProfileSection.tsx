import { StyleSheet, Text, View } from 'react-native'
import { colors, radius, space } from '../theme/tokens'

type Props = {
  title: string
  children: React.ReactNode
  /** Single surface panel for the section body (one card max per section). */
  surface?: boolean
}

export function ProfileSection({ title, children, surface = true }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{title}</Text>
      {surface ? <View style={styles.surface}>{children}</View> : <View style={styles.body}>{children}</View>}
    </View>
  )
}

export function ProfileSectionDivider() {
  return <View style={styles.divider} />
}

export function ProfileSectionBlock({ children }: { children: React.ReactNode }) {
  return <View style={styles.block}>{children}</View>
}

const styles = StyleSheet.create({
  section: { marginBottom: space.lg, gap: space.xs },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  surface: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  body: { gap: space.sm },
  block: { paddingHorizontal: space.md, paddingVertical: space.sm, gap: space.xs },
  divider: { height: 1, backgroundColor: colors.border },
})
