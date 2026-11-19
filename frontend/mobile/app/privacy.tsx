import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { privacyApi, profileApi } from '../src/api/endpoints'
import { ApiError } from '../src/api/http'
import { useAuth } from '../src/auth/AuthProvider'
import { WEB_URL } from '../src/config/env'
import { Button } from '../src/ui/Button'
import { EmptyState } from '../src/ui/EmptyState'
import { Screen } from '../src/ui/Screen'
import { ScrollChipRow } from '../src/ui/ScrollChipRow'
import { TextField } from '../src/ui/TextField'
import { colors, radius } from '../src/theme/tokens'
import {
  GENDER_CODES,
  GUARDIAN_LINK_DAYS,
  GUARDIAN_RELATIONSHIPS,
  birthDateProblem,
  guardianLink,
  guardianStatusOf,
  privacyErrorCode,
  toggleBlockReason,
  type PrivacySettings,
  type PrivacyToggle,
} from '../../web/src/shared/privacy/model'

const EXPOSURE: PrivacyToggle[] = ['channelPublic', 'talentSearchVisible', 'castingOffersEnabled']
const FIELDS: PrivacyToggle[] = ['showAge', 'showGender', 'showNationality', 'showResidence', 'showBio', 'showCareer', 'showSns']
const QUERY_KEY = ['me', 'privacy'] as const

/** 마이프로필 > 개인정보 및 공개 설정 (네이티브 우선). 10개 공개 항목 + 미성년자 보호 + 동의 내역. */
export default function PrivacyScreen() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated, ready } = useAuth()
  const qc = useQueryClient()
  const query = useQuery({ queryKey: QUERY_KEY, queryFn: privacyApi.get, enabled: isAuthenticated })
  const [draft, setDraft] = useState<PrivacySettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [guardianName, setGuardianName] = useState('')
  const [relationship, setRelationship] = useState<string>('PARENT')
  const [link, setLink] = useState<{ url: string; expiresAt: string | null } | null>(null)
  const [birth, setBirth] = useState('')

  useEffect(() => {
    if (query.data) setDraft(query.data)
  }, [query.data])

  if (ready && !isAuthenticated) {
    return (
      <Screen>
        <EmptyState title={t('privacy.loginRequired')} />
      </Screen>
    )
  }
  const s = draft
  const errorText = (e: unknown) => {
    const code = e instanceof ApiError ? privacyErrorCode(e.body) : null
    return code ? t(`privacy.errors.${code}`) : t('privacy.saveFailed')
  }
  const apply = (next: PrivacySettings) => {
    qc.setQueryData(QUERY_KEY, next)
    setDraft(next)
  }
  const flip = (key: PrivacyToggle) => setDraft((cur) => (cur ? { ...cur, [key]: !cur[key] } : cur))
  const dateText = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(i18n.language) : '')
  const gStatus = s ? guardianStatusOf(s) : 'NONE'
  const showMinor = s ? s.minor.minor || s.minor.guardianLegallyRequired : false

  return (
    <Screen loading={query.isLoading || (!s && !query.isError)}>
      <Text style={styles.title}>{t('privacy.menu')}</Text>
      <Text style={styles.hint}>{t('privacy.hint')}</Text>
      {query.isError ? <Text style={styles.error}>{t('privacy.loadFailed')}</Text> : null}
      {s ? (
        <>
          <Text style={styles.section}>{t('privacy.sectionExposure')}</Text>
          {EXPOSURE.map((key) => {
            const block = toggleBlockReason(s, key)
            return (
              <Toggle
                key={key}
                testID={`privacy-${key}`}
                label={t(`privacy.${key}`)}
                on={s[key]}
                disabled={Boolean(block) && !s[key]}
                warn={block && !s[key] ? t(`privacy.errors.${block}`) : undefined}
                onToggle={() => flip(key)}
              />
            )
          })}
          <Text style={styles.hintSmall}>{t('privacy.separateNote')}</Text>

          <Text style={styles.section}>{t('privacy.sectionFields')}</Text>
          {FIELDS.map((key) => (
            <Toggle key={key} testID={`privacy-${key}`} label={t(`privacy.${key}`)} on={s[key]} onToggle={() => flip(key)} />
          ))}
          <Text style={styles.label}>{t('privacy.genderValue')}</Text>
          <ScrollChipRow
            options={['', ...GENDER_CODES]}
            selected={s.gender ?? ''}
            onSelect={(g) => setDraft((cur) => (cur ? { ...cur, gender: g || null } : cur))}
            labelOf={(g) => (g ? t(`privacy.gender_${g}`) : t('privacy.genderNone'))}
          />
          <Text style={styles.hintSmall}>{t('privacy.fieldsHint')}</Text>
          {note ? <Text style={styles.note}>{note}</Text> : null}
          <Button
            label={t('privacy.save')}
            loading={saving}
            onPress={async () => {
              setSaving(true)
              setNote(null)
              try {
                const body: Record<string, unknown> = { gender: s.gender ?? '' }
                for (const k of [...EXPOSURE, ...FIELDS]) body[k] = s[k]
                apply(await privacyApi.save(body))
                setNote(t('privacy.saved'))
              } catch (e) {
                setNote(errorText(e))
              } finally {
                setSaving(false)
              }
            }}
          />

          {!s.birthDateSet ? (
            <View style={styles.card}>
              <Text style={styles.hintSmall}>{t('privacy.birthDateMissing')}</Text>
              <TextField label={t('consent.birthDate')} value={birth} onChangeText={setBirth} keyboardType="numbers-and-punctuation" />
              <Button
                label={t('privacy.save')}
                variant="secondary"
                onPress={async () => {
                  const p = birthDateProblem(birth)
                  if (p) {
                    setNote(t(p === 'required' ? 'consent.birthDateRequired' : 'consent.birthDateInvalid'))
                    return
                  }
                  try {
                    await profileApi.patch({ birthDate: birth.trim() })
                    apply(await privacyApi.get())
                  } catch (e) {
                    setNote(errorText(e))
                  }
                }}
              />
            </View>
          ) : null}

          {showMinor ? (
            <View style={styles.card} testID="privacy-minor">
              <Text style={styles.section}>{t('privacy.sectionMinor')}</Text>
              <Text style={styles.hintSmall}>{t('privacy.minorNotice')}</Text>
              <Text style={styles.meta}>
                {t('privacy.policyLine', {
                  country: s.minor.policyCountry,
                  adult: String(s.minor.adultAge),
                  under: String(s.minor.guardianConsentUnderAge),
                })}
              </Text>
              <Text style={styles.statusLine}>
                {t('privacy.guardianStatus')}: {t(`privacy.guardianStatus_${gStatus}`, { defaultValue: gStatus })}
              </Text>
              {s.minor.guardianLegallyRequired && !s.minor.guardianConfirmed ? (
                <Text style={styles.warn}>{t('privacy.guardianRequiredApply')}</Text>
              ) : null}
              {!s.minor.offersAllowed ? <Text style={styles.warn}>{t('privacy.guardianRequiredOffers')}</Text> : null}
              {!s.minor.contactSharingAllowed ? <Text style={styles.hintSmall}>{t('privacy.contactRestricted')}</Text> : null}
              {s.minor.minor && !s.minor.guardianConfirmed ? <Text style={styles.hintSmall}>{t('privacy.paymentGuardian')}</Text> : null}
              {!s.minor.guardianConfirmed ? (
                <>
                  <TextField label={t('privacy.guardianName')} value={guardianName} onChangeText={setGuardianName} autoCapitalize="words" />
                  <Text style={styles.label}>{t('privacy.relationship')}</Text>
                  <ScrollChipRow
                    options={GUARDIAN_RELATIONSHIPS}
                    selected={relationship}
                    onSelect={setRelationship}
                    labelOf={(r) => t(`privacy.rel_${r}`)}
                  />
                  <Button
                    label={gStatus === 'PENDING' ? t('privacy.renewLink') : t('privacy.createLink')}
                    variant="secondary"
                    onPress={async () => {
                      setNote(null)
                      try {
                        const issued = await privacyApi.requestGuardian({ guardianName: guardianName.trim() || undefined, relationship })
                        setLink({ url: guardianLink(WEB_URL, i18n.language, issued.token), expiresAt: issued.expiresAt })
                        apply(await privacyApi.get())
                      } catch (e) {
                        setNote(errorText(e))
                      }
                    }}
                  />
                </>
              ) : null}
              {link ? (
                <View style={styles.linkBox} testID="privacy-guardian-link">
                  <Text style={styles.hintSmall}>{t('privacy.linkCreated', { days: String(GUARDIAN_LINK_DAYS) })}</Text>
                  <Text selectable style={styles.link}>
                    {link.url}
                  </Text>
                  {link.expiresAt ? <Text style={styles.meta}>{t('privacy.linkExpires', { date: dateText(link.expiresAt) })}</Text> : null}
                  <Button
                    label={t('privacy.shareLink')}
                    onPress={() => void Share.share({ message: `${t('privacy.shareMessage')}\n${link.url}` })}
                  />
                </View>
              ) : null}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.section}>{t('privacy.sectionConsents')}</Text>
            {s.consents.length === 0 ? <Text style={styles.meta}>{t('privacy.consentNone')}</Text> : null}
            {s.consents.map((c) => (
              <Text key={c.type} style={styles.meta}>
                {t(`privacy.consentType_${c.type}`, { defaultValue: c.type })} · {t(`privacy.consentStatus_${c.status}`, { defaultValue: c.status })} ·{' '}
                {dateText(c.status === 'WITHDRAWN' ? c.withdrawnAt : c.agreedAt)}
                {c.termsVersion ? ` · ${t('privacy.consentVersion', { version: c.termsVersion })}` : ''}
              </Text>
            ))}
            <Toggle
              label={t('privacy.marketingToggle')}
              on={s.consents.some((c) => c.type === 'MARKETING' && c.status === 'AGREED')}
              onToggle={async () => {
                const on = s.consents.some((c) => c.type === 'MARKETING' && c.status === 'AGREED')
                try {
                  apply(await privacyApi.consent('MARKETING', !on))
                } catch (e) {
                  setNote(errorText(e))
                }
              }}
            />
            {s.consents.some((c) => c.type === 'PRIVACY_DISCLOSURE' && c.status === 'AGREED') ? (
              <>
                <Text style={styles.hintSmall}>{t('privacy.withdrawDisclosureNote')}</Text>
                <Button
                  label={t('privacy.withdrawDisclosure')}
                  variant="secondary"
                  onPress={async () => {
                    try {
                      apply(await privacyApi.consent('PRIVACY_DISCLOSURE', false))
                    } catch (e) {
                      setNote(errorText(e))
                    }
                  }}
                />
              </>
            ) : null}
          </View>
        </>
      ) : null}
    </Screen>
  )
}

function Toggle({
  label,
  warn,
  on,
  disabled,
  onToggle,
  testID,
}: {
  label: string
  warn?: string
  on: boolean
  disabled?: boolean
  onToggle: () => void
  testID?: string
}) {
  const { t } = useTranslation()
  return (
    <Pressable
      testID={testID}
      accessibilityRole="switch"
      accessibilityState={{ checked: on, disabled }}
      disabled={disabled}
      onPress={onToggle}
      style={[styles.toggle, disabled && styles.dim]}
    >
      <View style={styles.flex}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {warn ? <Text style={styles.warn}>{warn}</Text> : null}
      </View>
      <Text style={styles.stateText}>{on ? t('privacy.on') : t('privacy.off')}</Text>
      <View style={[styles.switch, on && styles.switchOn]}>
        <View style={[styles.knob, on && styles.knobOn]} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 4, marginBottom: 8 },
  hintSmall: { color: colors.muted, fontSize: 12, lineHeight: 18, marginVertical: 4 },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 16, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 8 },
  meta: { color: colors.muted, fontSize: 12, marginTop: 4 },
  statusLine: { color: colors.purple, fontWeight: '700', marginTop: 8 },
  note: { color: colors.purple, marginVertical: 6 },
  error: { color: colors.dangerText, marginVertical: 6 },
  warn: { color: colors.dangerText, fontSize: 12, marginTop: 2 },
  card: {
    marginTop: 16,
    padding: 12,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    gap: 6,
  },
  linkBox: { marginTop: 8, gap: 6 },
  link: { color: colors.purple, fontSize: 12 },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  stateText: { fontSize: 12, color: colors.muted },
  flex: { flex: 1 },
  dim: { opacity: 0.55 },
  switch: { width: 46, height: 28, borderRadius: 14, backgroundColor: '#d4d4d8', padding: 3 },
  switchOn: { backgroundColor: colors.purple },
  knob: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  knobOn: { transform: [{ translateX: 18 }] },
})
