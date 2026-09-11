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
import { colors, radius } from '../../src/theme/tokens'

export default function ProfileScreen() {
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
        <EmptyState title="프로필을 보려면 로그인하세요" actionLabel="로그인" onAction={() => router.push('/(auth)/login')} />
        <View style={{ height: 12 }} />
        <Button label="회원가입" variant="secondary" onPress={() => router.push('/(auth)/register')} />
      </Screen>
    )
  }

  return (
    <Screen loading={query.isLoading}>
      <Text style={styles.heading}>프로필</Text>
      <Text style={styles.meta}>{session?.email}</Text>
      <Text style={styles.role}>{session?.role}</Text>

      <View style={styles.card}>
        <TextField label="이름" value={name} onChangeText={setName} autoCapitalize="words" />
        <TextField label="닉네임" value={nickname} onChangeText={setNickname} />
        <TextField label="소개" value={intro} onChangeText={setIntro} multiline />
        <Button
          label="프로필 저장"
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
          기존 계정 복구 코드(한 번만): {issuedCode}
        </Text>
      ) : null}
      {recoveryNote ? <Text style={styles.meta}>{recoveryNote}</Text> : null}

      <View style={styles.links}>
        <Button
          label="복구 코드가 없으면 발급"
          variant="secondary"
          onPress={async () => {
            try {
              const res = await authApi.issueRecoveryCodeIfMissing()
              setIssuedCode(res.recoveryCode)
              setRecoveryNote('코드를 안전한 곳에 저장하세요. 다시 볼 수 없습니다.')
            } catch (err) {
              setRecoveryNote(err instanceof ApiError ? err.message : '발급에 실패했습니다.')
            }
          }}
        />
        <Button label="계정 찾기 / 비밀번호 재설정" variant="secondary" onPress={() => router.push('/(auth)/recover')} />
        <Button label="크레딧 / 충전" variant="secondary" onPress={() => router.push('/credits')} />
        <Button label="알림" variant="secondary" onPress={() => router.push('/notifications')} />
        {isAgencyRole(session?.role) ? (
          <Button label="내 오디션 지원자 관리" variant="secondary" onPress={() => router.push('/agency/applicants')} />
        ) : null}
        <Button
          label="오디션 생성 (웹)"
          variant="secondary"
          onPress={() => router.push({ pathname: '/web', params: { path: '/ko/my/auditions' } })}
        />
        <Button label="로그아웃" variant="danger" onPress={() => void logout()} />
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
})
