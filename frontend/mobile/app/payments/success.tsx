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

export default function PaymentSuccessScreen() {
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
      setError('결제 성공 파라미터가 올바르지 않습니다.')
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
        if (!cancelled) setError(err instanceof ApiError ? err.message : '승인에 실패했습니다. 크레딧은 지급되지 않았습니다.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [amount, orderId, paymentKey, queryClient])

  return (
    <Screen>
      {done ? <Text style={styles.ok}>충전이 완료되었습니다.</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!done && !error ? <Text style={styles.meta}>서버에서 결제를 승인하는 중…</Text> : null}
      <Button label="크레딧 스토어" onPress={() => router.replace('/credits')} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  ok: { color: colors.successText, fontWeight: '700', marginBottom: 16 },
  error: { color: colors.dangerText, marginBottom: 16, lineHeight: 22 },
  meta: { color: colors.muted, marginBottom: 16 },
})
