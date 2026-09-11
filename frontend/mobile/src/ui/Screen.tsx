import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, space } from '../theme/tokens'

type Props = {
  children: React.ReactNode
  padded?: boolean
  scroll?: boolean
  refreshing?: boolean
  onRefresh?: RefreshControlProps['onRefresh']
  loading?: boolean
  footer?: React.ReactNode
}

export function Screen({
  children,
  padded = true,
  scroll = true,
  loading,
  footer,
  refreshing,
  onRefresh,
}: Props) {
  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.purple} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, padded && styles.padded]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          refreshControl={
            onRefresh ? <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} /> : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, padded && styles.padded]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  content: { paddingBottom: 32 },
  padded: { paddingHorizontal: space.md, paddingTop: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
})
