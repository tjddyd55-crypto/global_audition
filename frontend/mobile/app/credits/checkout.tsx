import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import { WebView } from 'react-native-webview'
import { creditApi } from '../../src/api/endpoints'
import { ApiError } from '../../src/api/http'
import { RequireAuth } from '../../src/auth/RequireAuth'
import { isTossCancelCode } from '../../src/features/payments/tossCancel'
import { buildTossCheckoutHtml } from '../../src/features/payments/tossCheckoutHtml'
import { Screen } from '../../src/ui/Screen'
import { colors } from '../../src/theme/tokens'
import { useTranslation } from 'react-i18next'

const SUCCESS_SCHEME = 'globalaudition://payments/success'
const FAIL_SCHEME = 'globalaudition://payments/fail'

export default function CreditCheckoutScreen() {
  const { t } = useTranslation()
  const { packageId } = useLocalSearchParams<{ packageId: string }>()
  const router = useRouter()
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!packageId) {
      setError(t('payments.missingPackage'))
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const prep = await creditApi.prepare(packageId, 'TOSS_PAYMENTS')
        if (!prep.clientKey || prep.tossAmount == null) {
          throw new Error(t('payments.tossInactive'))
        }
        if (cancelled) return
        setHtml(
          buildTossCheckoutHtml({
            clientKey: prep.clientKey,
            orderId: prep.orderNo,
            orderName: prep.orderName || prep.packageName,
            amount: prep.tossAmount,
            currency: prep.currency,
            method: prep.tossMethod,
            foreignEasyPayProvider: prep.foreignEasyPayProvider,
            variantKey: prep.variantKey,
            successUrl: SUCCESS_SCHEME,
            failUrl: FAIL_SCHEME,
          }),
        )
      } catch (err) {
        if (!cancelled) setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : t('payments.createOrderFailed'))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [packageId, t])

  return (
    <RequireAuth message={t('payments.loginToPay')}>
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
              const code = parsed.searchParams.get('code') ?? ''
              const path = req.url.startsWith(SUCCESS_SCHEME)
                ? '/payments/success'
                : isTossCancelCode(code)
                  ? '/payments/cancel'
                  : '/payments/fail'
              router.replace({
                pathname: path,
                params: {
                  paymentKey: parsed.searchParams.get('paymentKey') ?? '',
                  orderId: parsed.searchParams.get('orderId') ?? '',
                  amount: parsed.searchParams.get('amount') ?? '',
                  message: parsed.searchParams.get('message') ?? '',
                  code,
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
