import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { castingApi } from '../../src/api/endpoints'
import { daysLeft, isOpenOffer } from '../../../web/src/shared/casting/model'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { colors, radius } from '../../src/theme/tokens'

export default function CastingInboxScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const qc = useQueryClient()
  const offers = useQuery({ queryKey: ['me', 'casting-offers'], queryFn: castingApi.offers })
  const blocks = useQuery({ queryKey: ['me', 'casting-blocks'], queryFn: castingApi.blocks })
  const unblock = useMutation({
    mutationFn: (agencyUserId: string) => castingApi.unblock(agencyUserId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me', 'casting-blocks'] }),
  })
  return (
    <Screen loading={offers.isLoading} onRefresh={() => void Promise.all([offers.refetch(), blocks.refetch()])}>
      <Text style={styles.title}>{t('casting.title')}</Text>
      <Text style={styles.body}>{t('casting.intro')}</Text>
      <Text style={styles.tip}>{t('casting.safetyTip')}</Text>
      {offers.isError ? <Text style={styles.body}>{t('casting.loadFailed')}</Text> : null}
      {offers.data && offers.data.length === 0 ? <Text style={styles.body}>{t('casting.empty')}</Text> : null}
      {(offers.data ?? []).map((o) => {
        const left = daysLeft(o.expiresAt)
        return (
          <Pressable
            key={o.id}
            accessibilityRole="button"
            onPress={() => router.push(`/casting/${o.id}`)}
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.row}>
              <Text style={[styles.cardTitle, o.status === 'SENT' && styles.unread]} numberOfLines={2}>
                {o.title}
              </Text>
              <Text style={styles.pill}>{t(`casting.status.${o.status}`, { defaultValue: o.status })}</Text>
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {o.agency?.name ?? '—'}
              {o.agencyBlocked ? ` · ${t('casting.agencyBlockedBadge')}` : ''}
            </Text>
            <Text style={styles.meta}>
              {o.createdAt ? `${t('casting.received')} ${new Date(o.createdAt).toLocaleDateString(i18n.language)}` : ''}
              {isOpenOffer(o) && left !== null ? ` · ${t('casting.daysLeft', { days: String(left) })}` : ''}
            </Text>
          </Pressable>
        )
      })}
      <Text style={[styles.title, styles.sub]}>{t('casting.blocksTitle')}</Text>
      {blocks.data && blocks.data.length === 0 ? <Text style={styles.body}>{t('casting.noBlocks')}</Text> : null}
      {(blocks.data ?? []).map((b) => (
        <View key={b.userId ?? ''} style={[styles.card, styles.row]}>
          <Text style={[styles.meta, styles.flex]} numberOfLines={1}>
            {b.name ?? '—'}
          </Text>
          <View>
            <Button label={t('casting.unblock')} variant="secondary" loading={unblock.isPending} onPress={() => b.userId && unblock.mutate(b.userId)} />
          </View>
        </View>
      ))}
    </Screen>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', marginBottom: 8, color: colors.text },
  sub: { fontSize: 17, marginTop: 20 },
  body: { color: colors.muted, lineHeight: 21, marginBottom: 10 },
  tip: { color: '#92400e', backgroundColor: '#fffbeb', borderRadius: radius.card, padding: 10, marginBottom: 12, lineHeight: 20 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 14, marginBottom: 8, backgroundColor: colors.surface, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1 },
  cardTitle: { flex: 1, fontWeight: '600', color: colors.text, fontSize: 15 },
  unread: { fontWeight: '800' },
  pill: { fontSize: 12, fontWeight: '700', color: colors.purple },
  meta: { color: colors.muted, fontSize: 13 },
})
