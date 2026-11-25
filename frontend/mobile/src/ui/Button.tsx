import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, radius, touch } from '../theme/tokens'

type Props = {
  fillHeight?: boolean
  label: string
  onPress: () => void
  disabled?: boolean
  loading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  accessibilityLabel?: string
}

export function Button({ label, onPress, disabled, loading, variant = 'primary', accessibilityLabel, fillHeight = false }: Props) {
  const isDisabled = disabled || loading
  if (variant === 'primary') {
    return (
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        style={({ pressed }) => [styles.base, fillHeight && styles.fill, isDisabled && styles.disabled, pressed && styles.pressed]}
      >
        <LinearGradient colors={[colors.purple, colors.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.gradient, fillHeight && styles.fill]}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text numberOfLines={fillHeight ? 1 : undefined} style={[styles.primaryText, fillHeight && styles.voteText]}>{label}</Text>}
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
        fillHeight && styles.fill,
        styles.outline,
        fillHeight && styles.voteOutline,
        variant === 'danger' && styles.danger,
        isDisabled && styles.disabled,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'danger' ? colors.dangerText : colors.text} />
      ) : (
        <Text numberOfLines={fillHeight ? 1 : undefined} style={[styles.outlineText, fillHeight && styles.voteText, variant === 'danger' && { color: colors.dangerText }]}>{label}</Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  voteText: { fontSize: 14, lineHeight: 24 },
  voteOutline: { paddingHorizontal: 12, paddingVertical: 8 },
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
