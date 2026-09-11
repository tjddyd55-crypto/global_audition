import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, StyleSheet, Text } from 'react-native'
import { useAuth } from '../../src/auth/AuthProvider'
import { ApiError } from '../../src/api/http'
import { isLoopbackApiUrl, API_BASE_URL } from '../../src/config/env'
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
      <KeyboardAvoidingView behavior="padding" style={styles.box}>
        <Text style={styles.title}>로그인</Text>
        {isLoopbackApiUrl() ? (
          <Text style={styles.warn}>
            API가 localhost를 가리킵니다. 실기기 Android는 폰 자신을 호출하므로 EXPO_PUBLIC_API_URL 을 웹 프록시 또는 LAN
            주소로 바꿔 주세요. 현재: {API_BASE_URL}
          </Text>
        ) : null}
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
        <Button label="계정 찾기 / 비밀번호 재설정" variant="secondary" onPress={() => router.push('/(auth)/recover')} />
      </KeyboardAvoidingView>
    </Screen>
  )
}

const styles = StyleSheet.create({
  box: { gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: 8 },
  error: { color: colors.dangerText },
  warn: { color: colors.warnText, backgroundColor: colors.warnBg, padding: 10, borderRadius: 8, lineHeight: 20 },
})
