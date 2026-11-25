import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View, type RefreshControlProps } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { colors, space } from '../theme/tokens'

type Props = {
  children?: React.ReactNode
  padded?: boolean
  topInset?: boolean
  bottomInset?: boolean
  scroll?: boolean
  refreshing?: boolean
  onRefresh?: RefreshControlProps['onRefresh']
  loading?: boolean
  footer?: React.ReactNode
}

export function Screen({
  children,
  padded = true,
  topInset = true,
  bottomInset = false,
  scroll = true,
  loading,
  footer,
  refreshing,
  onRefresh,
}: Props) {
  const edges: Edge[] = ['left', 'right']
  if (topInset) edges.push('top')
  if (bottomInset) edges.push('bottom')

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={edges}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.purple} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          // 페이지 자체는 세로만 움직인다. 국가 칩의 가로 스크롤은 필터 줄이 맡는다.
          horizontal={false}
          nestedScrollEnabled
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
