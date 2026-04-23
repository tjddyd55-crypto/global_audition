import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

type Props = {
  onRetry: () => void
}

/**
 * 네트워크 단절 혹은 WebView 로드 실패 시 표시하는 폴백 화면.
 *
 * 결정
 * - 네이티브에서 선제적으로 그려 "빈 WebView"가 보이는 UX를 방지한다.
 * - 재시도는 WebView.reload()를 부모에서 호출하도록 콜백으로 노출.
 */
export function OfflineScreen({ onRetry }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>연결할 수 없어요</Text>
      <Text style={styles.desc}>
        네트워크 연결을 확인한 뒤 다시 시도해 주세요.
      </Text>
      <TouchableOpacity
        onPress={onRetry}
        style={styles.button}
        accessibilityRole="button"
        accessibilityLabel="다시 시도"
      >
        <Text style={styles.buttonText}>다시 시도</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0a0a0a',
  },
  desc: {
    marginTop: 8,
    fontSize: 14,
    color: '#525252',
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0a0a0a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
})
