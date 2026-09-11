import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, radius, touch } from '../theme/tokens'

type Props = {
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  accessibilityLabel?: string
}

export function Button({ label, onPress, disabled, loading, variant = 'primary', accessibilityLabel }: Props) {
  const isDisabled = disabled || loading
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [styles.base, isDisabled && styles.disabled, pressed && styles.pressed]}
      >
        <LinearGradient colors={[colors.purple, colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.gradient}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}
        </LinearGradient>
      </Pressable>
    )
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.base,
        styles.outline,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'danger' ? colors.dangerText : colors.text} />
      ) : (
        <Text style={[styles.outlineText, variant === 'danger' && { color: colors.dangerText }]}>{label}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.min,
    borderRadius: radius.button,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gradient: {
    minHeight: touch.min,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  outline: {
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.surface,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  danger: {
    borderColor: '#fecaca',
    backgroundColor: colors.dangerBg,
  },
  primaryText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 15,
    textAlign: 'center',
    flexShrink: 1,
  },
  outlineText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
    flexShrink: 1,
  },
  disabled: { opacity: 0.55 },
  pressed: { opacity: 0.85 },
})
