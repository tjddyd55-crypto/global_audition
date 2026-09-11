import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { WebView } from 'react-native-webview'
import { creditApi } from '../../src/api/endpoints'
import { ApiError } from '../../src/api/http'
import { RequireAuth } from '../../src/auth/RequireAuth'
import { buildTossCheckoutHtml } from '../../src/features/payments/tossCheckoutHtml'
import { Screen } from '../../src/ui/Screen'
import { colors } from '../../src/theme/tokens'

const SUCCESS_SCHEME = 'globalaudition://payments/success'
const FAIL_SCHEME = 'globalaudition://payments/fail'

export default function CreditCheckoutScreen() {
  const { packageId } = useLocalSearchParams<{ packageId: string }>()
  const router = useRouter()
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!packageId) {
      setError('packageId가 없습니다.')
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const prep = await creditApi.prepare(packageId, 'TOSS_PAYMENTS')
        if (!prep.clientKey || prep.tossAmount == null) {
          throw new Error('토스 결제 설정이 없거나 비활성입니다. 관리자에게 문의하세요.')
        }
        if (cancelled) return
        setHtml(
          buildTossCheckoutHtml({
            clientKey: prep.clientKey,
            orderId: prep.orderNo,
            orderName: prep.orderName || prep.packageName,
            amount: prep.tossAmount,
            currency: prep.currency,
            successUrl: SUCCESS_SCHEME,
            failUrl: FAIL_SCHEME,
          }),
        )
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : '주문 생성 실패')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [packageId])

  return (
    <RequireAuth message="결제하려면 로그인이 필요합니다.">
      {error ? (
        <Screen>
          <Text style={styles.error}>{error}</Text>
        </Screen>
      ) : html ? (
        <WebView
          originWhitelist={['*']}
          source={{ html, baseUrl: 'https://tosspayments.com' }}
          onShouldStartLoadWithRequest={(req) => {
            if (req.url.startsWith(SUCCESS_SCHEME) || req.url.startsWith(FAIL_SCHEME)) {
              const parsed = new URL(req.url)
              const path = req.url.startsWith(SUCCESS_SCHEME) ? '/payments/success' : '/payments/fail'
              router.replace({
                pathname: path,
                params: {
                  paymentKey: parsed.searchParams.get('paymentKey') ?? '',
                  orderId: parsed.searchParams.get('orderId') ?? '',
                  amount: parsed.searchParams.get('amount') ?? '',
                  message: parsed.searchParams.get('message') ?? '',
                },
              })
              return false
            }
            return true
          }}
        />
      ) : (
        <Screen loading />
      )}
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  error: { color: colors.dangerText, lineHeight: 22 },
})
