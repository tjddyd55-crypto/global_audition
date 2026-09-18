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
import { EmptyState } from '../../src/ui/EmptyState'
import { LanguageSwitcher } from '../../src/ui/LanguageSwitcher'
import { ProfileCompletionBar } from '../../src/ui/ProfileCompletionBar'
import { ProfileLinkRow } from '../../src/ui/ProfileLinkRow'
import { ProfileMenuRow } from '../../src/ui/ProfileMenuRow'
import { ProfileSection, ProfileSectionBlock, ProfileSectionDivider } from '../../src/ui/ProfileSection'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { localeWebPath } from '../../src/i18n/webPath'
import { colors, space } from '../../src/theme/tokens'

const BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/

type SnsRow = { platform: string; url: string }

export default function ProfileScreen() {
  const { t } = useTranslation()
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
  const displayName = nickname.trim() || name.trim() || session?.email || ''

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
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.heading}>{t('profile.myTitle')}</Text>
          <LanguageSwitcher />
        </View>
        <View style={styles.headerBody}>
          <View style={styles.avatarWrap}>
            {profileImageUrl ? (
              <Image source={{ uri: profileImageUrl }} style={styles.avatar} accessibilityIgnoresInvertColors />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{displayName.slice(0, 1).toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={styles.headerText}>
            <Text style={styles.displayName} numberOfLines={2}>{displayName}</Text>
            <Text style={styles.email} numberOfLines={1}>{session?.email}</Text>
            {session?.role ? <Text style={styles.role}>{session.role}</Text> : null}
            <ProfileCompletionBar percent={completion} compact />
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        <ProfileMenuRow
          title={t('nav.applications')}
          subtitle={t('profile.myApplicationsHint')}
          onPress={() => router.push('/applications')}
        />
      </View>

      <ProfileSection title={t('apply.sectionBasic')}>
        <ProfileSectionBlock>
          <TextField label={t('profile.name')} value={name} onChangeText={setName} autoCapitalize="words" />
        </ProfileSectionBlock>
        <ProfileSectionDivider />
        <ProfileSectionBlock>
          <TextField
            label={t('profile.nickname')}
            value={nickname}
            onChangeText={setNickname}
            placeholder={t('profile.nicknamePlaceholder')}
          />
        </ProfileSectionBlock>
        <ProfileSectionDivider />
        <ProfileSectionBlock>
          <TextField label={t('apply.birthDate')} value={birthDate} onChangeText={setBirthDate} placeholder={t('apply.birthDateHint')} />
          {birthDate.trim() && !BIRTH_RE.test(birthDate.trim()) ? (
            <Text style={styles.error}>{t('profile.birthFormat')}</Text>
          ) : null}
          {age != null ? <Text style={styles.meta}>{t('profile.ageAuto', { age })}</Text> : null}
        </ProfileSectionBlock>
        <ProfileSectionDivider />
        <ProfileSectionBlock>
          <Text style={styles.fieldLabel}>{t('apply.nationality')}</Text>
          <View style={styles.chips}>
            {ALLOWED_NATIONALITIES.map((code) => (
              <Chip key={code} label={nationalityLabel(code)} selected={nationality === code} onPress={() => setNationality(code)} />
            ))}
          </View>
        </ProfileSectionBlock>
      </ProfileSection>

      <ProfileSection title={t('apply.sns')}>
        {snsRows.length === 0 ? (
          <ProfileSectionBlock>
            <Text style={styles.meta}>{t('profile.snsEmpty')}</Text>
          </ProfileSectionBlock>
        ) : null}
        {snsRows.map((row, index) => (
          <View key={index}>
            {index > 0 ? <ProfileSectionDivider /> : null}
            <ProfileSectionBlock>
              <Text style={styles.fieldLabel}>{t('apply.sns')}</Text>
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
            </ProfileSectionBlock>
          </View>
        ))}
        <ProfileSectionDivider />
        <ProfileSectionBlock>
          <Text style={styles.meta}>{t('profile.snsHint')}</Text>
          <Button
            label={t('common.add')}
            variant="secondary"
            onPress={() => setSnsRows((prev) => [...prev, { platform: 'instagram', url: '' }])}
          />
        </ProfileSectionBlock>
      </ProfileSection>

      <ProfileSection title={t('profile.intro')}>
        <ProfileSectionBlock>
          <TextField
            label={t('profile.intro')}
            value={intro}
            onChangeText={setIntro}
            multiline
            placeholder={t('profile.introPlaceholder')}
          />
        </ProfileSectionBlock>
      </ProfileSection>

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

      <ProfileSection title={t('profile.sectionMedia')}>
        <ProfileLinkRow title={t('profile.videos')} onPress={() => router.push('/videos')} />
        <ProfileLinkRow
          title={t('channel.studioTitle')}
          onPress={() => router.push({ pathname: '/web', params: { path: localeWebPath('/my/channel') } })}
          showDivider={false}
        />
      </ProfileSection>

      <ProfileSection title={t('profile.sectionAccount')}>
        <ProfileLinkRow
          title={t('profile.issueRecovery')}
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
        <ProfileLinkRow title={t('profile.findAccount')} onPress={() => router.push('/(auth)/recover')} />
        <ProfileLinkRow title={t('profile.notifications')} onPress={() => router.push('/notifications')} />
        {isAgencyRole(session?.role) ? (
          <ProfileLinkRow title={t('profile.manageApplicants')} onPress={() => router.push('/agency/applicants')} />
        ) : null}
        <ProfileLinkRow
          title={t('profile.createAuditionWeb')}
          onPress={() => router.push({ pathname: '/web', params: { path: localeWebPath('/my/auditions') } })}
        />
        <ProfileLinkRow title={t('common.logout')} onPress={() => void logout()} danger showDivider={false} />
      </ProfileSection>

      {issuedCode ? (
        <Text selectable style={styles.meta}>
          {t('profile.recoveryOnce', { code: issuedCode })}
        </Text>
      ) : null}
      {recoveryNote ? <Text style={styles.meta}>{recoveryNote}</Text> : null}
      {dashboardQuery.data ? (
        <Text style={styles.footerMeta}>{t('profile.videos')}: {dashboardQuery.data.videosCount}</Text>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { marginBottom: space.md, gap: space.sm },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
  },
  headerBody: { ...narrow.row, alignItems: 'flex-start', gap: space.md },
  headerText: { flex: 1, minWidth: 0, gap: 2 },
  heading: { fontSize: 22, fontWeight: '800', color: colors.text, ...narrow.shrink },
  displayName: { fontSize: 18, fontWeight: '800', color: colors.text, lineHeight: 24 },
  email: { color: colors.textSecondary, fontWeight: '500', fontSize: 14 },
  role: { color: colors.purple, fontWeight: '700', fontSize: 13 },
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
  menu: { marginBottom: space.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.muted },
  meta: { color: colors.muted, fontSize: 13, lineHeight: 20, ...narrow.shrink },
  footerMeta: { color: colors.faint, fontSize: 12, marginTop: space.sm, textAlign: 'center' },
  chips: { ...narrow.wrap },
  error: { color: colors.dangerText, lineHeight: 20, marginBottom: space.xs },
  ok: { color: colors.successText, fontWeight: '600', marginBottom: space.sm },
})
