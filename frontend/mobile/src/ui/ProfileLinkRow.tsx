import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { colors, space, touch } from '../theme/tokens'

type Props = {
  title: string
  subtitle?: string
  onPress: () => void
  accessibilityLabel?: string
  danger?: boolean
  showDivider?: boolean
}

export function ProfileLinkRow({
  title,
  subtitle,
  onPress,
  accessibilityLabel,
  danger,
  showDivider = true,
}: Props) {
  return (
    <>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? title}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      >
        <View style={styles.text}>
          <Text style={[styles.title, danger && styles.dangerTitle]} numberOfLines={2}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.faint} />
      </Pressable>
      {showDivider ? <View style={styles.divider} /> : null}
    </>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touch.min + 4,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  text: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  dangerTitle: { color: colors.dangerText },
  subtitle: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: space.md },
  pressed: { opacity: 0.88 },
})
