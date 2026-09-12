import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, StyleSheet, Text } from 'react-native'
import { useAuth } from '../../src/auth/AuthProvider'
import { ApiError } from '../../src/api/http'
import { API_BASE_URL, isCurrentApiLoopback } from '../../src/config/env'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { colors } from '../../src/theme/tokens'
import { useTranslation } from 'react-i18next'

export default function LoginScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={styles.box}>
        <Text style={styles.title}>{t('auth.loginTitle')}</Text>
        {isCurrentApiLoopback() ? (
          <Text style={styles.warn}>
            {t('auth.apiLoopbackWarn')} {API_BASE_URL}
          </Text>
        ) : null}
        <TextField label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TextField label={t('auth.password')} value={password} onChangeText={setPassword} secureTextEntry />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={t('auth.loginButton')}
          loading={loading}
          onPress={async () => {
            setError(null)
            setLoading(true)
            try {
              await login(email.trim(), password)
              router.replace('/(tabs)')
            } catch (err) {
              setError(err instanceof ApiError ? err.message : t('auth.loginError'))
            } finally {
              setLoading(false)
            }
          }}
        />
        <Button label={t('auth.registerButton')} variant="secondary" onPress={() => router.push('/(auth)/register')} />
        <Button label={t('auth.findAccount')} variant="secondary" onPress={() => router.push('/(auth)/recover')} />
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
