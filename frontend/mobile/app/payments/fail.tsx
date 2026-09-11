import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { colors } from '../../src/theme/tokens'

export default function PaymentFailScreen() {
  const router = useRouter()
  const { message } = useLocalSearchParams<{ message?: string }>()
  return (
    <Screen>
      <Text style={styles.error}>{message || '결제가 취소되었거나 실패했습니다. 크레딧은 지급되지 않았습니다.'}</Text>
      <Button label="크레딧 스토어" onPress={() => router.replace('/credits')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.dangerText, marginBottom: 16, lineHeight: 22 },
})
