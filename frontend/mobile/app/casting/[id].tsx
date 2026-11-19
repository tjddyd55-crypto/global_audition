import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { apiErrorCodeOf, castingApi } from '../../src/api/endpoints'
import { DECLINE_REASONS, REPORT_REASONS, daysLeft, displayStatus, isOpenOffer } from '../../../web/src/shared/casting/model'
import { useOfferTranslation } from '../../src/features/casting/useOfferTranslation'
import { Button } from '../../src/ui/Button'
import { ConfirmDialog } from '../../src/ui/ConfirmDialog'
import { Screen } from '../../src/ui/Screen'
import { colors, radius } from '../../src/theme/tokens'

type Panel = 'none' | 'accept' | 'decline' | 'report'

export default function CastingDetailScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const qc = useQueryClient()
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const id = String(rawId ?? '')
  const [panel, setPanel] = useState<Panel>('none')
  const [share, setShare] = useState(false)
  const [note, setNote] = useState('')
  const [reason, setReason] = useState<string>('NOT_INTERESTED')
  const [reportReason, setReportReason] = useState<string>('SPAM')
  const [detail, setDetail] = useState('')
  const [alsoBlock, setAlsoBlock] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [flash, setFlash] = useState('')
  const [error, setError] = useState('')
  const offer = useQuery({ queryKey: ['me', 'casting-offer', id], queryFn: () => castingApi.offer(id), enabled: Boolean(id) })
  const tr = useOfferTranslation(offer.data?.id)

  const done = async (msg: string) => {
    setPanel('none')
    setConfirmBlock(false)
    setError('')
    setFlash(msg)
    await qc.invalidateQueries({ queryKey: ['me'] })
  }
  const fail = (e: unknown) => {
    const code = apiErrorCodeOf(e)
    setError(i18n.exists(`casting.error.${code}`) ? t(`casting.error.${code}`) : t('casting.error.generic'))
  }
  const accept = useMutation({ mutationFn: () => castingApi.accept(id, share, note), onSuccess: () => done(t('casting.accepted')), onError: fail })
  const decline = useMutation({ mutationFn: () => castingApi.decline(id, reason, note), onSuccess: () => done(t('casting.declined')), onError: fail })
  const report = useMutation({ mutationFn: () => castingApi.report(id, reportReason, detail, alsoBlock), onSuccess: () => done(t('casting.reported')), onError: fail })
  const block = useMutation({ mutationFn: () => castingApi.block(id), onSuccess: () => done(t('casting.blocked')), onError: fail })
  const busy = accept.isPending || decline.isPending || report.isPending || block.isPending

  const o = offer.data
  const open = o ? isOpenOffer(o) : false
  const left = o ? daysLeft(o.expiresAt) : null
  const label = (group: string, key: string | null) => (key ? t(`casting.${group}.${key}`, { defaultValue: key }) : '')
  const fieldLabel = (code: string) => t(`recruitField.${code}`, { defaultValue: code })
  const country = (code: string | null) => (code ? t(`nationality.${code}`, { defaultValue: code }) : '')

  return (
    <Screen loading={offer.isLoading} onRefresh={() => offer.refetch()}>
      <Pressable onPress={() => router.back()} accessibilityRole="link">
        <Text style={styles.back}>← {t('casting.back')}</Text>
      </Pressable>
      {offer.isError ? <Text style={styles.err}>{t('casting.error.OFFER_NOT_FOUND')}</Text> : null}
      {o ? (
        <View style={styles.gap}>
          <View style={styles.row}>
            <Text style={styles.pill}>{label('status', displayStatus(o))}</Text>
            <Text style={[styles.meta, styles.flex]} numberOfLines={2}>
              {t('casting.from')}: {o.agency?.name ?? '—'}
              {o.agencyBlocked ? ` · ${t('casting.agencyBlockedBadge')}` : ''}
            </Text>
          </View>
          <Text style={styles.title}>{tr.text(o.title, 'title') || o.title}</Text>
          <Fact k={t('casting.project')} v={label('projectType', o.projectType)} />
          <Fact k={t('casting.role')} v={fieldLabel(o.roleField)} />
          <Fact k={t('casting.workPlace')} v={[country(o.workCountry), tr.text(o.workLocation, 'workLocation')].filter(Boolean).join(' · ')} />
          <Fact k={t('casting.schedule')} v={tr.text(o.scheduleText, 'scheduleText')} />
          <Fact k={t('casting.compensation')} v={[label('compensationType', o.compensationType), tr.text(o.compensationNote, 'compensationNote')].filter(Boolean).join(' · ')} />
          <Fact
            k={t('casting.deadline')}
            v={
              o.expiresAt
                ? `${new Date(o.expiresAt).toLocaleDateString(i18n.language)}${open && left !== null ? ` · ${t('casting.daysLeft', { days: String(left) })}` : ''}`
                : ''
            }
          />
          <Text style={styles.label}>{t('casting.message')}</Text>
          <Text style={styles.message} selectable>
            {tr.text(o.message, 'message') || o.message}
          </Text>
          {tr.view ? (
            <Pressable onPress={() => tr.setShowOriginal(!tr.showOriginal)} accessibilityRole="button">
              <Text style={styles.link}>{tr.showOriginal ? t('translation.viewTranslation') : t('translation.viewOriginal')}</Text>
            </Pressable>
          ) : null}
          {o.contactRequested ? <Text style={styles.info}>{o.contactShared ? t('casting.contactShared') : t('casting.contactRequested')}</Text> : null}
          {o.status === 'WITHDRAWN' ? <Text style={styles.meta}>{t('casting.withdrawnNotice')}</Text> : null}
          <Text style={styles.meta}>{t('casting.intro')}</Text>
          {flash ? <Text style={styles.ok}>{flash}</Text> : null}
          {error ? <Text style={styles.err}>{error}</Text> : null}

          {open ? (
            <View style={styles.actions}>
              <View style={styles.flex}>
                <Button label={t('casting.accept')} onPress={() => setPanel('accept')} />
              </View>
              <View style={styles.flex}>
                <Button label={t('casting.decline')} variant="secondary" onPress={() => setPanel('decline')} />
              </View>
            </View>
          ) : null}
          <View style={styles.actions}>
            <View style={styles.flex}>
              <Button label={t('casting.report')} variant="danger" onPress={() => setPanel('report')} />
            </View>
            {!o.agencyBlocked ? (
              <View style={styles.flex}>
                <Button label={t('casting.block')} variant="secondary" onPress={() => setConfirmBlock(true)} />
              </View>
            ) : null}
          </View>

          {panel === 'accept' ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('casting.acceptTitle')}</Text>
              <Text style={styles.meta}>{t('casting.acceptNotice')}</Text>
              {o.contactRequested ? (
                <View style={styles.row}>
                  <Text style={[styles.meta, styles.flex]}>{t('casting.shareContact')}</Text>
                  <Switch value={share} onValueChange={setShare} accessibilityLabel={t('casting.shareContact')} />
                </View>
              ) : null}
              <Input label={t('casting.noteLabel')} value={note} onChange={setNote} />
              <Button label={t('casting.confirmAccept')} loading={busy} onPress={() => accept.mutate()} />
              <Button label={t('casting.cancel')} variant="secondary" onPress={() => setPanel('none')} />
            </View>
          ) : null}
          {panel === 'decline' ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('casting.declineTitle')}</Text>
              <Text style={styles.label}>{t('casting.declineReasonLabel')}</Text>
              <Chips options={DECLINE_REASONS.map((r) => [r, t(`casting.declineReason.${r}`)])} value={reason} onChange={setReason} />
              <Input label={t('casting.noteLabel')} value={note} onChange={setNote} />
              <Button label={t('casting.confirmDecline')} loading={busy} onPress={() => decline.mutate()} />
              <Button label={t('casting.cancel')} variant="secondary" onPress={() => setPanel('none')} />
            </View>
          ) : null}
          {panel === 'report' ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>{t('casting.reportTitle')}</Text>
              <Text style={styles.label}>{t('casting.reportReasonLabel')}</Text>
              <Chips options={REPORT_REASONS.map((r) => [r, t(`casting.reportReason.${r}`)])} value={reportReason} onChange={setReportReason} />
              <Input label={t('casting.reportDetail')} value={detail} onChange={setDetail} />
              <View style={styles.row}>
                <Text style={[styles.meta, styles.flex]}>{t('casting.reportBlock')}</Text>
                <Switch value={alsoBlock} onValueChange={setAlsoBlock} accessibilityLabel={t('casting.reportBlock')} />
              </View>
              <Button label={t('casting.confirmReport')} variant="danger" loading={busy} onPress={() => report.mutate()} />
              <Button label={t('casting.cancel')} variant="secondary" onPress={() => setPanel('none')} />
            </View>
          ) : null}

          {o.history.length ? (
            <View style={styles.gapSm}>
              <Text style={styles.label}>{t('casting.history')}</Text>
              {o.history.map((e, i) => (
                <Text key={i} style={styles.meta}>
                  {e.createdAt ? new Date(e.createdAt).toLocaleString(i18n.language) : ''} · {label('actor', e.actorKind)} · {label('status', e.toStatus)}
                </Text>
              ))}
            </View>
          ) : null}
          <ConfirmDialog
            visible={confirmBlock}
            message={t('casting.blockConfirm')}
            confirmLabel={t('casting.block')}
            cancelLabel={t('casting.cancel')}
            danger
            loading={block.isPending}
            onCancel={() => setConfirmBlock(false)}
            onConfirm={() => block.mutate()}
          />
        </View>
      ) : null}
    </Screen>
  )
}

function Fact({ k, v }: { k: string; v: string }) {
  if (!v) return null
  return (
    <View style={styles.fact}>
      <Text style={styles.factKey}>{k}</Text>
      <Text style={styles.factVal}>{v}</Text>
    </View>
  )
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.gapSm}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} multiline maxLength={500} accessibilityLabel={label} />
    </View>
  )
}

function Chips({ options, value, onChange }: { options: [string, string][]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.chips}>
      {options.map(([k, l]) => (
        <Pressable
          key={k}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === k }}
          onPress={() => onChange(k)}
          style={[styles.chip, value === k && styles.chipOn]}
        >
          <Text style={[styles.chipText, value === k && styles.chipTextOn]}>{l}</Text>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  back: { color: colors.muted, marginBottom: 10 },
  gap: { gap: 10 },
  gapSm: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text },
  pill: { fontSize: 12, fontWeight: '800', color: colors.purple },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  message: { color: colors.text, backgroundColor: colors.surface, borderRadius: radius.card, padding: 12, lineHeight: 21, borderWidth: 1, borderColor: colors.border },
  link: { color: colors.purple, textDecorationLine: 'underline', fontSize: 13 },
  info: { color: '#0c4a6e', backgroundColor: '#f0f9ff', borderRadius: radius.card, padding: 10 },
  ok: { color: '#065f46', backgroundColor: '#ecfdf5', borderRadius: radius.card, padding: 10 },
  err: { color: '#b91c1c', backgroundColor: '#fef2f2', borderRadius: radius.card, padding: 10 },
  actions: { flexDirection: 'row', gap: 8 },
  panel: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 12, gap: 8, backgroundColor: colors.surface },
  panelTitle: { fontWeight: '800', color: colors.text, fontSize: 16 },
  fact: { flexDirection: 'row', gap: 10 },
  factKey: { width: 92, color: colors.muted, fontSize: 13 },
  factVal: { flex: 1, color: colors.text, fontSize: 14 },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, minHeight: 64, color: colors.text, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipOn: { backgroundColor: colors.purple, borderColor: colors.purple },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextOn: { color: '#fff', fontWeight: '700' },
})
