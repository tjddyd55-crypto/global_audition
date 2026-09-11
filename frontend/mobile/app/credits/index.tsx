import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { StyleSheet, Text, View } from 'react-native'
import { creditApi } from '../../src/api/endpoints'
import { queryKeys } from '../../src/api/queryKeys'
import { RequireAuth } from '../../src/auth/RequireAuth'
import { Button } from '../../src/ui/Button'
import { EmptyState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { colors, radius } from '../../src/theme/tokens'

function ledgerSign(amount: number, type: string, reason: string): string {
  if (type === 'USE' || amount < 0) return `-${Math.abs(amount)}`
  return `+${Math.abs(amount)}`
}

function ledgerLabel(type: string, reason: string): string {
  if (reason === 'PACKAGE_PURCHASE') return '충전'
  if (reason === 'AUDITION_APPLY') return '지원 차감'
  if (reason === 'ADMIN_GRANT' || type === 'GRANT') return '관리자 지급'
  if (reason === 'ADMIN_DEDUCT') return '관리자 차감'
  if (reason === 'SIGNUP_REWARD') return '가입 보상'
  if (type === 'REFUND') return '환불'
  return reason || type
}

export default function CreditStoreScreen() {
  const router = useRouter()
  const balance = useQuery({ queryKey: queryKeys.creditBalance, queryFn: creditApi.balance })
  const packages = useQuery({ queryKey: queryKeys.creditPackages, queryFn: creditApi.packages })
  const ledger = useQuery({ queryKey: queryKeys.creditLedger, queryFn: creditApi.ledger })

  return (
    <RequireAuth message="크레딧을 보려면 로그인이 필요합니다.">
      <Screen
        loading={balance.isLoading}
        onRefresh={async () => {
          await Promise.all([balance.refetch(), packages.refetch(), ledger.refetch()])
        }}
      >
        <Text style={styles.heading}>크레딧</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.muted}>보유 잔액</Text>
          <Text style={styles.balance}>{balance.data?.balance ?? 0}</Text>
        </View>

        <Text style={styles.section}>충전 패키지</Text>
        {packages.isError ? (
          <EmptyState title="패키지를 불러오지 못했습니다" actionLabel="다시 시도" onAction={() => void packages.refetch()} />
        ) : null}
        {(packages.data ?? []).map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.pkgName}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.price} · {item.credits}
              {item.bonusCredits > 0 ? ` +${item.bonusCredits}` : ''} 크레딧
            </Text>
            <Button label="충전하기" onPress={() => router.push({ pathname: '/credits/checkout', params: { packageId: item.id } })} />
          </View>
        ))}
        {packages.data && packages.data.length === 0 ? <Text style={styles.muted}>판매 중인 패키지가 없습니다.</Text> : null}

        <Text style={styles.section}>원장</Text>
        {(ledger.data?.content ?? []).map((row) => (
          <View key={row.id} style={styles.ledgerRow}>
            <Text style={styles.ledgerLabel}>{ledgerLabel(row.type, row.reason)}</Text>
            <Text style={row.amount < 0 || row.type === 'USE' ? styles.minus : styles.plus}>
              {ledgerSign(row.amount, row.type, row.reason)}
            </Text>
          </View>
        ))}
        {ledger.data?.content.length === 0 ? <Text style={styles.muted}>내역이 없습니다.</Text> : null}
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
