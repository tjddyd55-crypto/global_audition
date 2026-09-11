import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { authApi, isAgencyRole, profileApi } from '../../src/api/endpoints'
import { ApiError } from '../../src/api/http'
import { queryKeys } from '../../src/api/queryKeys'
import { useAuth } from '../../src/auth/AuthProvider'
import { Button } from '../../src/ui/Button'
import { EmptyState } from '../../src/ui/EmptyState'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { persistLocale } from '../../src/i18n/LocaleProvider'
import { PRIMARY_LOCALES } from '../../src/i18n/runtime'
import { colors, radius } from '../../src/theme/tokens'
import { useTranslation } from 'react-i18next'

export default function ProfileScreen() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { isAuthenticated, ready, session, logout } = useAuth()
  const query = useQuery({ queryKey: queryKeys.profile, queryFn: profileApi.get, enabled: isAuthenticated })
  const [name, setName] = useState('')
  const [nickname, setNickname] = useState('')
  const [intro, setIntro] = useState('')
  const [saving, setSaving] = useState(false)
  const [recoveryNote, setRecoveryNote] = useState<string | null>(null)
  const [issuedCode, setIssuedCode] = useState<string | null>(null)

  useEffect(() => {
    if (!query.data) return
    setName(query.data.name ?? '')
    setNickname(query.data.nickname ?? '')
    setIntro(query.data.introText ?? '')
  }, [query.data])

  if (ready && !isAuthenticated) {
    return (
      <Screen>
        <EmptyState title={t('auth.recoverLoginRequired')} actionLabel={t('common.login')} onAction={() => router.push('/(auth)/login')} />
        <View style={{ height: 12 }} />
        <Button label={t('common.register')} variant="secondary" onPress={() => router.push('/(auth)/register')} />
      </Screen>
    )
  }

  return (
    <Screen loading={query.isLoading}>
      <Text style={styles.heading}>{t('profile.title')}</Text>
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
      <Text style={styles.meta}>{session?.email}</Text>
      <Text style={styles.role}>{session?.role}</Text>

      <View style={styles.card}>
        <TextField label={t('profile.name')} value={name} onChangeText={setName} autoCapitalize="words" />
        <TextField label={t('profile.nickname')} value={nickname} onChangeText={setNickname} />
        <TextField label={t('profile.intro')} value={intro} onChangeText={setIntro} multiline />
        <Button
          label={t('profile.save')}
          loading={saving}
          onPress={async () => {
            setSaving(true)
            try {
              await profileApi.patch({ name, nickname, introText: intro })
              await query.refetch()
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
              setRecoveryNote(err instanceof ApiError ? err.message : '발급에 실패했습니다.')
            }
          }}
        />
        <Button label="계정 찾기 / 비밀번호 재설정" variant="secondary" onPress={() => router.push('/(auth)/recover')} />
        <Button label={t('nav.credits')} variant="secondary" onPress={() => router.push('/credits')} />
        <Button label="알림" variant="secondary" onPress={() => router.push('/notifications')} />
        {isAgencyRole(session?.role) ? (
          <Button label="내 오디션 지원자 관리" variant="secondary" onPress={() => router.push('/agency/applicants')} />
        ) : null}
        <Button
          label="오디션 생성 (웹)"
          variant="secondary"
          onPress={() => router.push({ pathname: '/web', params: { path: '/ko/my/auditions' } })}
        />
        <Button label={t('common.logout')} variant="danger" onPress={() => void logout()} />
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  heading: { fontSize: 22, fontWeight: '800', color: colors.text },
  meta: { color: colors.muted, marginTop: 4 },
  role: { color: colors.purple, fontWeight: '700', marginBottom: 16, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  links: { marginTop: 20, gap: 10 },
  langRow: { marginBottom: 16, gap: 8 },
  langBtns: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
