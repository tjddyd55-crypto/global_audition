import { useLocalSearchParams, useRouter } from 'expo-router'
import { StyleSheet, Text } from 'react-native'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { colors } from '../../src/theme/tokens'
import { useTranslation } from 'react-i18next'

export default function PaymentFailScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { message } = useLocalSearchParams<{ message?: string }>()
  return (
    <Screen>
      <Text style={styles.error}>{message || t('payments.cancelled')}</Text>
      <Button label={t('payments.store')} onPress={() => router.replace('/credits')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.dangerText, marginBottom: 16, lineHeight: 22 },
})
