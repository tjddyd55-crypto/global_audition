import { useLocalSearchParams } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { WebViewApp } from '../src/components/WebViewApp'

/**
 * 복잡한 오디션 생성 등 웹 전용 흐름을 기존 PWA 셸로 연다.
 * PC/웹을 삭제하지 않고, 네이티브에서 가치 낮은 관리 화면만 위임한다.
 */
export default function WebFallbackScreen() {
  const { path } = useLocalSearchParams<{ path?: string }>()
  return (
    <View style={styles.fill}>
      <WebViewApp initialPath={typeof path === 'string' ? path : undefined} />
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
})
