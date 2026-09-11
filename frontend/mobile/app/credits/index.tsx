import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { creditApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { RequireAuth } from '../../src/auth/RequireAuth'
import { Button } from '../../src/ui/Button'
import { EmptyState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { useTranslation } from 'react-i18next'
import { formatUsd } from '../../src/i18n/format'
import { colors, radius } from '../../src/theme/tokens'

function ledgerSign(amount: number, type: string, reason: string): string {
  if (type === 'USE' || amount < 0) return `-${Math.abs(amount)}`
  return `+${Math.abs(amount)}`
}

function ledgerLabel(t: (key: string) => string, type: string, reason: string): string {
  if (reason === 'PACKAGE_PURCHASE') return t('credits.reasonPurchase')
  if (reason === 'AUDITION_APPLY') return t('credits.reasonApply')
  if (reason === 'ADMIN_GRANT' || type === 'GRANT') return t('credits.reasonGrant')
  if (reason === 'ADMIN_DEDUCT') return t('credits.reasonDeduct')
  if (reason === 'SIGNUP_REWARD') return t('credits.reasonSignup')
  if (type === 'REFUND') return t('credits.reasonRefund')
  return reason || type
}

export default function CreditStoreScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const balance = useQuery({ queryKey: queryKeys.creditBalance, queryFn: creditApi.balance })
  const packages = useQuery({ queryKey: queryKeys.creditPackages, queryFn: creditApi.packages })
  const ledger = useQuery({ queryKey: queryKeys.creditLedger, queryFn: creditApi.ledger })

  return (
    <RequireAuth message={t('credits.loginRequired')}>
      <Screen
        loading={balance.isLoading}
        onRefresh={async () => {
          await Promise.all([balance.refetch(), packages.refetch(), ledger.refetch()])
        }}
      >
        <Text style={styles.heading}>{t('credits.title')}</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.muted}>{t('credits.balance')}</Text>
          <Text style={styles.balance}>{balance.data?.balance ?? 0}</Text>
        </View>

        <Text style={styles.section}>{t('credits.packages')}</Text>
        {packages.isError ? (
          <EmptyState title={t('common.error')} actionLabel={t('common.retry')} onAction={() => void packages.refetch()} />
        ) : null}
        {(packages.data ?? []).map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.pkgName}>{item.name}</Text>
            <Text style={styles.meta}>
              {formatUsd(item.price)} · {item.credits}
              {item.bonusCredits > 0 ? ` +${item.bonusCredits}` : ''} {t('credits.creditUnit')}
            </Text>
            <Button label={t('credits.charge')} onPress={() => router.push({ pathname: '/credits/checkout', params: { packageId: item.id } })} />
          </View>
        ))}
        {packages.data && packages.data.length === 0 ? <Text style={styles.muted}>{t('credits.emptyPackages')}</Text> : null}

        <Text style={styles.section}>{t('credits.ledger')}</Text>
        {(ledger.data?.content ?? []).map((row) => (
          <View key={row.id} style={styles.ledgerRow}>
            <Text style={styles.ledgerLabel}>{ledgerLabel(t, row.type, row.reason)}</Text>
            <Text style={row.amount < 0 || row.type === 'USE' ? styles.minus : styles.plus}>
              {ledgerSign(row.amount, row.type, row.reason)}
            </Text>
          </View>
        ))}
        {ledger.data?.content.length === 0 ? <Text style={styles.muted}>{t('credits.emptyLedger')}</Text> : null}
      </Screen>
    </RequireAuth>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  section: { marginTop: 20, marginBottom: 8, fontWeight: '700', color: colors.text },
  muted: { color: colors.muted },
  balanceCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: radius.card,
    backgroundColor: colors.heroStart,
    borderWidth: 1,
    borderColor: colors.border,
  },
  balance: { fontSize: 32, fontWeight: '800', color: colors.purple, marginTop: 4 },
  card: {
    padding: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 8,
    marginBottom: 10,
  },
  pkgName: { fontWeight: '700', color: colors.text },
  meta: { color: colors.muted },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  ledgerLabel: { color: colors.text },
  plus: { color: colors.successText, fontWeight: '700' },
  minus: { color: colors.dangerText, fontWeight: '700' },
})
