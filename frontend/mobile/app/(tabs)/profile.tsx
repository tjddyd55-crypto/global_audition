import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { authApi, dashboardApi, isAgencyRole, profileApi } from '../../src/api/endpoints'
import { ApiError } from '../../src/api/http'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { calculateAge } from '../../src/domain/age'
import { profileCompletionPercent } from '../../src/domain/profileCompletion'
import { ALLOWED_NATIONALITIES, ALLOWED_SNS_PLATFORMS, nationalityLabel, snsPlatformLabel } from '../../src/domain/statusLabels'
import { narrow } from '../../src/theme/narrow'
import { Button } from '../../src/ui/Button'
import { Chip } from '../../src/ui/Chip'
import { DetailSection } from '../../src/ui/DetailSection'
import { EmptyState } from '../../src/ui/EmptyState'
import { ProfileCompletionBar } from '../../src/ui/ProfileCompletionBar'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { persistLocale } from '../../src/i18n/LocaleProvider'
import { localeWebPath } from '../../src/i18n/webPath'
import { PRIMARY_LOCALES } from '../../src/i18n/runtime'
import { colors, radius, space } from '../../src/theme/tokens'

const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/

type SnsRow = { platform: string; url: string }

export default function ProfileScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { isAuthenticated, ready, session, logout } = useAuth()
  const query = useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.get, enabled: isAuthenticated })
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.applicant,
    enabled: isAuthenticated && session?.role === 'APPLICANT',
  })

  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [nationality, setNationality] = useState('')
  const [intro, setIntro] = useState('')
  const [snsRows, setSnsRows] = useState<SnsRow[]>([])
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)
  const [recoveryNote, setRecoveryNote] = useState<string | null>(null)
  const [issuedCode, setIssuedCode] = useState<string | null>(null)

  useEffect(() => {
    if (!query.data) return
    setName(query.data.name ?? '')
    setNickname(query.data.nickname ?? '')
    setBirthDate(query.data.birthDate ?? '')
    setNationality(query.data.nationality ?? '')
    setIntro(query.data.introText ?? '')
    const links = query.data.snsLinks ?? []
    setSnsRows(links.length > 0 ? links.map((l) => ({ platform: l.platform, url: l.url })) : [])
  }, [query.data])

  const age = useMemo(() => (birthDate.trim() && BIRTH_RE.test(birthDate.trim()) ? calculateAge(birthDate) : null), [birthDate])
  const completion = profileCompletionPercent(query.data)

  if (ready && !isAuthenticated) {
    return (
      <Screen>
        <EmptyState title={t('auth.recoverLoginRequired')} actionLabel={t('common.login')} onAction={() => router.push('/(auth)/login')} />
        <View style={{ height: 12 }} />
        <Button label={t('common.register')} variant="secondary" onPress={() => router.push('/(auth)/register')} />
      </Screen>
    )
  }

  const profileImageUrl = query.data?.profileImageUrl

  return (
    <Screen loading={query.isLoading}>
      <Text style={styles.heading}>{t('profile.myTitle')}</Text>
      <ProfileCompletionBar percent={completion} />

      <View style={styles.langRow}>
        <Text style={styles.meta}>{t('profile.language')}</Text>
        <View style={styles.langBtns}>
          {PRIMARY_LOCALES.map((code) => (
            <Button
              key={code}
              label={t(`locale.${code}`)}
              variant={i18n.language === code ? 'primary' : 'secondary'}
              onPress={() => void persistLocale(code)}
            />
          ))}
        </View>
      </View>

      <View style={styles.identity}>
        <View style={styles.avatarWrap}>
          {profileImageUrl ? (
            <Image source={{ uri: profileImageUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{(nickname || name || '?').slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={narrow.shrink}>
          <Text style={styles.email} numberOfLines={1}>{session?.email}</Text>
          <Text style={styles.role}>{session?.role}</Text>
          {dashboardQuery.data ? (
            <Text style={styles.meta}>{t('profile.videos')}: {dashboardQuery.data.videosCount}</Text>
          ) : null}
        </View>
      </View>

      <View style={styles.card}>
        <DetailSection title={t('apply.sectionBasic')}>
          <TextField label={t('profile.name')} value={name} onChangeText={setName} autoCapitalize="words" />
          <TextField label={t('profile.nickname')} value={nickname} onChangeText={setNickname} placeholder={t('profile.nicknamePlaceholder')} />
          <TextField label={t('apply.birthDate')} value={birthDate} onChangeText={setBirthDate} placeholder={t('apply.birthDateHint')} />
          {birthDate.trim() && !BIRTH_RE.test(birthDate.trim()) ? (
            <Text style={styles.error}>{t('profile.birthFormat')}</Text>
          ) : null}
          {age != null ? <Text style={styles.meta}>{t('profile.ageAuto', { age })}</Text> : null}
          <Text style={styles.label}>{t('apply.nationality')}</Text>
          <View style={styles.chips}>
            {ALLOWED_NATIONALITIES.map((code) => (
              <Chip key={code} label={nationalityLabel(code)} selected={nationality === code} onPress={() => setNationality(code)} />
            ))}
          </View>
        </DetailSection>

        <DetailSection title={t('apply.sns')}>
          <Text style={styles.meta}>{t('profile.snsHint')}</Text>
          {snsRows.length === 0 ? <Text style={styles.meta}>{t('profile.snsEmpty')}</Text> : null}
          {snsRows.map((row, index) => (
            <View key={index} style={styles.snsRow}>
              <View style={styles.chips}>
                {ALLOWED_SNS_PLATFORMS.map((platform) => (
                  <Chip
                    key={platform}
                    label={snsPlatformLabel(platform)}
                    selected={row.platform === platform}
                    onPress={() =>
                      setSnsRows((prev) => prev.map((item, i) => (i === index ? { ...item, platform } : item)))
                    }
                  />
                ))}
              </View>
              <TextField
                label={t('apply.snsUrl')}
                value={row.url}
                onChangeText={(url) => setSnsRows((prev) => prev.map((item, i) => (i === index ? { ...item, url } : item)))}
                keyboardType="url"
              />
              <Button
                label={t('common.remove')}
                variant="secondary"
                onPress={() => setSnsRows((prev) => prev.filter((_, i) => i !== index))}
              />
            </View>
          ))}
          <Button
            label={t('common.add')}
            variant="secondary"
            onPress={() => setSnsRows((prev) => [...prev, { platform: 'instagram', url: '' }])}
          />
        </DetailSection>

        <DetailSection title={t('profile.intro')}>
          <TextField
            label={t('profile.intro')}
            value={intro}
            onChangeText={setIntro}
            multiline
            placeholder={t('profile.introPlaceholder')}
          />
        </DetailSection>

        {saveOk ? <Text style={styles.ok}>{t('common.success')}</Text> : null}
        {formError ? <Text style={styles.error}>{formError}</Text> : null}

        <Button
          label={t('profile.save')}
          loading={saving}
          onPress={async () => {
            setFormError(null)
            setSaveOk(false)
            if (nickname.trim().length < 2) {
              setFormError(t('profile.nicknameMin'))
              return
            }
            if (birthDate.trim() && !BIRTH_RE.test(birthDate.trim())) {
              setFormError(t('profile.birthFormat'))
              return
            }
            const cleanedSns = snsRows
              .map((row) => ({ platform: row.platform.trim(), url: row.url.trim() }))
              .filter((row) => row.platform || row.url)
            if (cleanedSns.some((row) => !row.platform || !row.url)) {
              setFormError(t('profile.snsPairRequired'))
              return
            }
            setSaving(true)
            try {
              await profileApi.patch({
                name: name.trim(),
                nickname: nickname.trim(),
                birthDate: birthDate.trim() || null,
                nationality: nationality || null,
                introText: intro.trim() || null,
                snsLinks: cleanedSns,
              })
              await query.refetch()
              setSaveOk(true)
            } catch (err) {
              setFormError(err instanceof ApiError ? err.message : t('profile.loadFailed'))
            } finally {
              setSaving(false)
            }
          }}
        />
      </View>

      {issuedCode ? (
        <Text selectable style={styles.meta}>
          {t('profile.recoveryOnce', { code: issuedCode })}
        </Text>
      ) : null}
      {recoveryNote ? <Text style={styles.meta}>{recoveryNote}</Text> : null}

      <View style={styles.links}>
        <Button
          label={t('profile.issueRecovery')}
          variant="secondary"
          onPress={async () => {
            try {
              const res = await authApi.issueRecoveryCodeIfMissing()
              setIssuedCode(res.recoveryCode)
              setRecoveryNote(t('profile.recoveryKeep'))
            } catch (err) {
              setRecoveryNote(err instanceof ApiError ? err.message : t('profile.issueFailed'))
            }
          }}
        />
        <Button label={t('profile.findAccount')} variant="secondary" onPress={() => router.push('/(auth)/recover')} />
        <Button label={t('profile.notifications')} variant="secondary" onPress={() => router.push('/notifications')} />
        {isAgencyRole(session?.role) ? (
          <Button label={t('profile.manageApplicants')} variant="secondary" onPress={() => router.push('/agency/applicants')} />
        ) : null}
        <Button
          label={t('channel.studioTitle')}
          variant="secondary"
          onPress={() => router.push({ pathname: '/web', params: { path: localeWebPath('/my/channel') } })}
        />
        <Button
          label={t('profile.createAuditionWeb')}
          variant="secondary"
          onPress={() => router.push({ pathname: '/web', params: { path: localeWebPath('/my/auditions') } })}
        />
        <Button label={t('common.logout')} variant="danger" onPress={() => void logout()} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, ...narrow.shrink },
  meta: { color: colors.muted, marginTop: 4, fontSize: 13, lineHeight: 20, ...narrow.shrink },
  role: { color: colors.purple, fontWeight: '700', marginTop: 2 },
  email: { color: colors.text, fontWeight: '600', fontSize: 15 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
    gap: space.md,
  },
  links: { marginTop: space.lg, gap: 10 },
  langRow: { marginBottom: space.md, gap: space.xs },
  langBtns: { ...narrow.wrap },
  identity: { ...narrow.row, alignItems: 'center', marginBottom: space.md, gap: space.md },
  avatarWrap: { flexShrink: 0 },
  avatar: { width: 72, height: 72, borderRadius: 36 },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.heroStart,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 28, fontWeight: '800', color: colors.purple },
  label: { fontWeight: '700', color: colors.text },
  chips: { ...narrow.wrap },
  snsRow: { gap: space.xs, paddingVertical: space.xs, borderTopWidth: 1, borderTopColor: colors.border },
  error: { color: colors.dangerText, lineHeight: 20 },
  ok: { color: colors.successText, fontWeight: '600' },
})
