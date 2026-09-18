import { StyleSheet, View, type ViewStyle } from 'react-native'
import { LanguageSwitcher } from './LanguageSwitcher'
import { space } from '../theme/tokens'

type Props = {
  children?: React.ReactNode
  style?: ViewStyle
}

/** Right-aligned header actions: language switcher + optional trailing control (avatar, etc.). */
export function ScreenHeaderActions({ children, style }: Props) {
  return (
    <View style={[styles.row, style]}>
      <LanguageSwitcher />
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    flexShrink: 0,
  },
})
