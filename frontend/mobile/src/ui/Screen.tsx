import { useSegments } from 'expo-router'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTabBarMetrics } from '../theme/tabBarMetrics'
import { colors, space } from '../theme/tokens'

type Props = {
  children?: React.ReactNode
  padded?: boolean
  scroll?: boolean
  refreshing?: boolean
  onRefresh?: RefreshControlProps['onRefresh']
  loading?: boolean
  footer?: React.ReactNode
  /** When false, skip KeyboardAvoidingView (rare full-screen layouts). */
  keyboardAware?: boolean
}

export function Screen({
  children,
  padded = true,
  scroll = true,
  loading,
  footer,
  refreshing,
  onRefresh,
  keyboardAware = true,
}: Props) {
  const segments = useSegments()
  const isTabRoot = segments[0] === '(tabs)'
  const tabMetrics = useTabBarMetrics()
  const scrollBottomPadding = isTabRoot ? tabMetrics.scrollContentPaddingBottom : space.xl

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.purple} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  const scrollContent = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }, padded && styles.padded]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      refreshControl={onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded]}>{children}</View>
  )

  const body =
    keyboardAware && scroll ? (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {scrollContent}
      </KeyboardAvoidingView>
    ) : (
      scrollContent
    )

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {body}
      {footer}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { flexGrow: 1 },
  padded: { paddingHorizontal: space.md, paddingTop: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
