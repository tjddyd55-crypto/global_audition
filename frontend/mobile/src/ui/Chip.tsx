import { Pressable, StyleSheet, Text } from 'react-native'
import { colors, radius, touch } from '../theme/tokens'

type Props = {
  label: string
  selected?: boolean
  onPress: () => void
  disabled?: boolean
}

export function Chip({ label, selected, onPress, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected), disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipOn,
        disabled && styles.chipDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelOn, disabled && styles.labelDisabled]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  chip: {
    minHeight: touch.min,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    maxWidth: '100%',
  },
  chipOn: {
    borderColor: colors.purple,
    backgroundColor: colors.heroStart,
  },
  chipDisabled: { opacity: 0.45 },
  pressed: { opacity: 0.9 },
  label: { color: colors.muted, fontSize: 14 },
  labelOn: { color: colors.purple, fontWeight: '700' },
  labelDisabled: { color: colors.faint },
})
