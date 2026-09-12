import type { ReactNode } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native'
import { colors, radius, space } from '../theme/tokens'
import { narrow } from '../theme/narrow'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

export function AuthScreenShell({ title, subtitle, children }: Props) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.wrap}>
      <LinearGradient colors={[colors.heroStart, colors.surface]} style={styles.hero}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </LinearGradient>
      <View style={styles.card}>{children}</View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: space.md },
  hero: {
    borderRadius: radius.card,
    padding: space.lg,
    gap: space.xs,
  },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, ...narrow.shrink },
  subtitle: { fontSize: 14, color: colors.muted, lineHeight: 22, ...narrow.shrink },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.sm,
  },
})
