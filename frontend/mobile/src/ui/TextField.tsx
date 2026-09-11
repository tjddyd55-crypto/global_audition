import { StyleSheet, Text, TextInput, View } from 'react-native'
import { colors, radius, touch } from '../theme/tokens'

type Props = {
  label: string
  value: string
  onChangeText: (value: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words'
  keyboardType?: 'default' | 'email-address' | 'url' | 'numeric'
  multiline?: boolean
  error?: string
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
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
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
