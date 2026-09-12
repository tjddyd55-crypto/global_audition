import { useRouter } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../src/auth/AuthProvider'
import { ApiError } from '../../src/api/http'
import { validateSignupDraft } from '../../src/domain/signupRules'
import { AuthScreenShell } from '../../src/ui/AuthScreenShell'
import { Button } from '../../src/ui/Button'
import { Chip } from '../../src/ui/Chip'
import { RecoveryCodeNotice } from '../../src/ui/RecoveryCodeNotice'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { narrow } from '../../src/theme/narrow'
import { colors } from '../../src/theme/tokens'

export default function RegisterScreen() {
  const { t } = useTranslation()
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
      <AuthScreenShell title={t('auth.registerTitle')} subtitle={t('auth.signupHint')}>
        <View style={styles.roles}>
          <Chip label={t('auth.applicant')} selected={role === 'APPLICANT'} onPress={() => setRole('APPLICANT')} />
          <Chip label={t('auth.business')} selected={role === 'AGENCY'} onPress={() => setRole('AGENCY')} />
        </View>
        <TextField label={t('auth.nickname')} value={nickname} onChangeText={setNickname} />
        <TextField label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TextField label={t('auth.passwordMin6')} value={password} onChangeText={setPassword} secureTextEntry />
        <TextField label={t('auth.legalNameOptional')} value={name} onChangeText={setName} autoCapitalize="words" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={t('auth.registerButton')}
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
              setError(err instanceof ApiError ? err.message : t('auth.registerError'))
            } finally {
              setLoading(false)
            }
          }}
        />
        <Button label={t('common.login')} variant="secondary" onPress={() => router.push('/(auth)/login')} />
      </AuthScreenShell>
    </Screen>
  )
}

const styles = StyleSheet.create({
  roles: { ...narrow.wrap, marginBottom: 4 },
  error: { color: colors.dangerText, marginVertical: 4 },
})
