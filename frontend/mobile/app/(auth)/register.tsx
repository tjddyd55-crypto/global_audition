import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../src/auth/AuthProvider'
import { ApiError } from '../../src/api/http'
import { validateSignupDraft } from '../../src/domain/signupRules'
import { Button } from '../../src/ui/Button'
import { RecoveryCodeNotice } from '../../src/ui/RecoveryCodeNotice'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { colors, radius } from '../../src/theme/tokens'

export default function RegisterScreen() {
  const router = useRouter()
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<'APPLICANT' | 'AGENCY'>('APPLICANT')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [issuedCode, setIssuedCode] = useState<string | null>(null)

  if (issuedCode) {
    return (
      <Screen>
        <RecoveryCodeNotice recoveryCode={issuedCode} onAcknowledged={() => router.replace('/(tabs)')} />
      </Screen>
    )
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={styles.box}>
        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.hint}>서버가 받는 항목만 입력합니다. 이메일·비밀번호·닉네임·역할(선택 실명).</Text>
        <View style={styles.roles}>
          <RoleChip label="지원자" selected={role === 'APPLICANT'} onPress={() => setRole('APPLICANT')} />
          <RoleChip label="기획사" selected={role === 'AGENCY'} onPress={() => setRole('AGENCY')} />
        </View>
        <TextField label="닉네임" value={nickname} onChangeText={setNickname} />
        <TextField label="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TextField label="비밀번호 (6자 이상)" value={password} onChangeText={setPassword} secureTextEntry />
        <TextField label="실명 (선택)" value={name} onChangeText={setName} autoCapitalize="words" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="가입하기"
          loading={loading}
          onPress={async () => {
            const draft = {
              email: email.trim(),
              password,
              nickname: nickname.trim(),
              role,
              name: name.trim() || undefined,
            }
            const localError = validateSignupDraft(draft)
            if (localError) {
              setError(localError)
              return
            }
            setError(null)
            setLoading(true)
            try {
              const result = await signup(draft)
              if (result.recoveryCode) {
                setIssuedCode(result.recoveryCode)
                return
              }
              router.replace('/(tabs)')
            } catch (err) {
              setError(err instanceof ApiError ? err.message : '가입에 실패했습니다.')
            } finally {
              setLoading(false)
            }
          }}
        />
        <Button label="로그인" variant="secondary" onPress={() => router.push('/(auth)/login')} />
      </KeyboardAvoidingView>
    </Screen>
  )
}

function RoleChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]} accessibilityRole="button">
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  box: { gap: 12 },
  title: { fontSize: 24, fontWeight: '800', marginBottom: 4, color: colors.text },
  hint: { color: colors.muted, fontSize: 13, lineHeight: 20, marginBottom: 8 },
  roles: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colors.purple, backgroundColor: colors.heroStart },
  chipText: { fontWeight: '600', color: colors.muted },
  chipTextOn: { color: colors.purple },
  error: { color: colors.dangerText, marginVertical: 4 },
})
