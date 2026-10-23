import { StyleSheet, Text } from 'react-native'
import { RequireAuth } from '../../src/auth/RequireAuth'
import { Screen } from '../../src/ui/Screen'
import { colors } from '../../src/theme/tokens'
import { useTranslation } from 'react-i18next'

/**
 * Credits are digital goods. Apple App Store Review Guideline 3.1.1 and Google Play
 * Payments policy require in-app purchase for digital content. This screen does not
 * open Toss, PayPal, or another external checkout.
 * https://developer.apple.com/app-store/review/guidelines/#payments
 * https://support.google.com/googleplay/android-developer/answer/9858738
 */
export default function CreditCheckoutScreen() {
  const { t } = useTranslation()
  return (
    <RequireAuth>
      <Screen>
        <Text style={styles.title}>{t('payments.checkout')}</Text>
        <Text style={styles.body}>{t('payments.iapNotice')}</Text>
      </Screen>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 12 },
  body: { color: colors.text, fontSize: 16, lineHeight: 24 },
})
