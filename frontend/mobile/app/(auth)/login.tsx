import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, StyleSheet, Text } from 'react-native'
import { useAuth } from '../../src/auth/AuthProvider'
import { ApiError } from '../../src/api/http'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { colors } from '../../src/theme/tokens'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.box}>
        <Text style={styles.title}>로그인</Text>
        <TextField label="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TextField label="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="로그인"
          loading={loading}
          onPress={async () => {
            setError(null)
            setLoading(true)
            try {
              await login(email.trim(), password)
              router.replace('/(tabs)')
            } catch (err) {
              setError(err instanceof ApiError ? err.message : '로그인에 실패했습니다.')
            } finally {
              setLoading(false)
            }
          }}
        />
        <Button label="회원가입" variant="secondary" onPress={() => router.push('/(auth)/register')} />
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  box: { gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  error: { color: colors.dangerText },
})
