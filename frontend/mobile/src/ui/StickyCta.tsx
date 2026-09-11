import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, space } from '../theme/tokens'

export function StickyCta({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets()
  return <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>{children}</View>
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingTop: 12,
    gap: 8,
  },
})
