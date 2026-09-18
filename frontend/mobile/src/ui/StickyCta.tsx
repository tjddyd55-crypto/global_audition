import { useEffect, useState } from 'react'
import { Keyboard, Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, space } from '../theme/tokens'

export function StickyCta({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets()
  const bottomPad = Math.max(insets.bottom, space.sm)
  const [keyboardVisible, setKeyboardVisible] = useState(false)

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  if (keyboardVisible) return null

  return <View style={[styles.bar, { paddingBottom: bottomPad }]}>{children}</View>
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
