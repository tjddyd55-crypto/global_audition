import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { creditApi } from '../../src/api/endpoints'
import { ApiError } from '../../src/api/http'
import { queryKeys } from '../../src/api/queryKeys'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { colors } from '../../src/theme/tokens'
import { useTranslation } from 'react-i18next'

export default function PaymentSuccessScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { paymentKey, orderId, amount } = useLocalSearchParams<{
    paymentKey?: string
    orderId?: string
    amount?: string
  }>()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const key = paymentKey?.trim() ?? ''
    const order = orderId?.trim() ?? ''
    const amt = Number(amount)
    if (!key || !order || !Number.isFinite(amt)) {
      setError(t('payments.successParamsInvalid'))
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        await creditApi.confirmToss({ paymentKey: key, orderId: order, amount: amt })
        await queryClient.invalidateQueries({ queryKey: queryKeys.creditBalance })
        await queryClient.invalidateQueries({ queryKey: queryKeys.creditLedger })
        if (!cancelled) setDone(true)
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : t('payments.confirmFailed'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [amount, orderId, paymentKey, queryClient])

  return (
    <Screen>
      {done ? <Text style={styles.ok}>{t('payments.chargeComplete')}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!done && !error ? <Text style={styles.meta}>{t('payments.confirming')}</Text> : null}
      <Button label={t('payments.store')} onPress={() => router.replace('/credits')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  ok: { color: colors.successText, fontWeight: '700', marginBottom: 16 },
  error: { color: colors.dangerText, marginBottom: 16, lineHeight: 22 },
  meta: { color: colors.muted, marginBottom: 16 },
})
