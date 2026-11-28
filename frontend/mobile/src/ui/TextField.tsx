import { useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native'
import { colors, radius, touch } from '../theme/tokens'

type Props = {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  autoCapitalize?: TextInputProps['autoCapitalize']
  keyboardType?: TextInputProps['keyboardType']
  multiline?: boolean
  error?: string
  allowSwipeWhenBlurred?: boolean
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  autoCapitalize = 'none',
  keyboardType = 'default',
  multiline,
  error,
  allowSwipeWhenBlurred,
}: Props) {
  const input = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)
  // On Android, a native text input can capture a vertical drag before the form receives it.
  const tapToEdit = Platform.OS === 'android' && allowSwipeWhenBlurred && !focused
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View>
        <TextInput
          ref={input}
          onFocus={allowSwipeWhenBlurred ? () => setFocused(true) : undefined}
          onBlur={allowSwipeWhenBlurred ? () => setFocused(false) : undefined}
          importantForAccessibility={tapToEdit ? 'no' : 'auto'}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[styles.input, multiline && styles.multiline, error ? styles.invalid : null]}
          accessibilityLabel={label}
        />
        {tapToEdit ? (
          <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={label}
            accessibilityValue={secureTextEntry ? undefined : { text: value }} onPress={() => input.current?.focus()} />
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted },
  input: {
    minHeight: touch.min,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.input,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
  invalid: { borderColor: colors.dangerText },
  error: { color: colors.dangerText, fontSize: 12 },
})
