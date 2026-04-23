import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import { useOtaPromptState } from '../services/updates'

/**
 * 다운로드 완료된 OTA 번들을 사용자가 즉시 적용할지 물어보는 모달.
 *
 * 책임을 UI 표시만으로 한정한다.
 * - 표시 여부, 액션 동작은 `useOtaPromptState()`가 모두 결정한다.
 * - 이 컴포넌트가 OTA 정책을 알 필요는 없다.
 *
 * UX 원칙
 * - 사용자가 명시적으로 버튼을 눌러야 닫힌다(backdrop 터치로는 안 닫힘).
 *   "지금 업데이트"와 "나중에" 중 어느 쪽도 실수로 눌러지면 안 되기 때문이다.
 * - "지금 업데이트"를 누르면 곧 재시작되므로 중간에 스피너를 보여 의도치 않은
 *   이중 탭이나 "왜 반응이 없지?" 오해를 막는다.
 */
export function OtaUpdatePrompt() {
  const { shouldShow, applyNow, dismiss } = useOtaPromptState()
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    if (isApplying) return
    setIsApplying(true)
    try {
      await applyNow()
      // reloadAsync가 호출되면 앱이 재시작되므로 이 아래 코드는 실질적으로 도달하지
      // 않는다. 다만 어떤 이유로 실패해 reload가 일어나지 않으면 스피너가 영원히
      // 도는 것을 막기 위해 상태를 되돌린다.
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <Modal
      visible={shouldShow}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>새 버전이 준비되었어요</Text>
          <Text style={styles.body}>
            최신 업데이트가 다운로드 완료되었습니다.{'\n'}
            지금 적용하려면 앱이 잠시 재시작됩니다.
          </Text>

          <View style={styles.actions}>
            <Pressable
              onPress={dismiss}
              disabled={isApplying}
              style={({ pressed }) => [
                styles.button,
                styles.secondary,
                pressed && styles.secondaryPressed,
                isApplying && styles.disabled,
              ]}
            >
              <Text style={styles.secondaryText}>나중에</Text>
            </Pressable>

            <Pressable
              onPress={handleApply}
              disabled={isApplying}
              style={({ pressed }) => [
                styles.button,
                styles.primary,
                pressed && styles.primaryPressed,
                isApplying && styles.disabled,
              ]}
            >
              {isApplying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryText}>지금 업데이트</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const BRAND_PURPLE = '#7c3aed'
const BRAND_PURPLE_PRESSED = '#6d28d9'

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#374151',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  button: {
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: BRAND_PURPLE,
  },
  primaryPressed: {
    backgroundColor: BRAND_PURPLE_PRESSED,
  },
  primaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondary: {
    backgroundColor: '#f3f4f6',
  },
  secondaryPressed: {
    backgroundColor: '#e5e7eb',
  },
  secondaryText: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.6,
  },
})
