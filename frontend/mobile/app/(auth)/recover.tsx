import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Pressable, StyleSheet, Text, View } from 'react-native'
import { authApi } from '../../src/api/endpoints'
import { ApiError } from '../../src/api/http'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { colors, radius } from '../../src/theme/tokens'
import { useTranslation } from 'react-i18next'

type Mode = 'identify' | 'reset' | 'lost'

export default function RecoverScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('identify')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [accountIdentifier, setAccountIdentifier] = useState('')
  const [requesterName, setRequesterName] = useState('')
  const [contact, setContact] = useState('')
  const [message, setMessage] = useState('')
  const [hint, setHint] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <Screen>
      <KeyboardAvoidingView behavior="padding" style={styles.box}>
        <Text style={styles.title}>{t('auth.findAccount')}</Text>
        <View style={styles.modes}>
          <ModeChip label={t('auth.identify')} selected={mode === 'identify'} onPress={() => setMode('identify')} />
          <ModeChip label={t('auth.resetPassword')} selected={mode === 'reset'} onPress={() => setMode('reset')} />
          <ModeChip label={t('auth.lostCode')} selected={mode === 'lost'} onPress={() => setMode('lost')} />
        </View>
        {hint ? <Text style={styles.hint}>{t('auth.confirmedAccount', { id: hint })}</Text> : null}
        {success ? <Text style={styles.ok}>{success}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mode === 'identify' ? (
          <>
            <TextField label={t('auth.recoveryCode')} value={recoveryCode} onChangeText={setRecoveryCode} />
            <Button
              label={t('auth.confirmAccount')}
              loading={loading}
              onPress={async () => {
                setError(null)
                setSuccess(null)
                setLoading(true)
                try {
                  const res = await authApi.identifyByRecoveryCode(recoveryCode)
                  setHint(res.accountIdentifier)
                  setAccountIdentifier(res.accountIdentifier)
                  setSuccess(t('auth.identified'))
                  setMode('reset')
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : t('auth.identifyFailed'))
                } finally {
                  setLoading(false)
                }
              }}
            />
          </>
        ) : null}

        {mode === 'reset' ? (
          <>
            <TextField label={t('auth.recoveryCode')} value={recoveryCode} onChangeText={setRecoveryCode} />
            <TextField label={t('auth.newPasswordMin6')} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <TextField label={t('auth.confirmNewPassword')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <Button
              label={t('auth.setNewPassword')}
              loading={loading}
              onPress={async () => {
                setError(null)
                setSuccess(null)
                if (newPassword.length < 6) {
                  setError(t('auth.passwordTooShort'))
                  return
                }
                if (newPassword !== confirmPassword) {
                  setError(t('auth.passwordMismatch'))
                  return
                }
                setLoading(true)
                try {
                  if (!hint) {
                    const id = await authApi.identifyByRecoveryCode(recoveryCode)
                    setHint(id.accountIdentifier)
                  }
                  await authApi.resetPasswordWithRecoveryCode(recoveryCode, newPassword)
                  setSuccess(t('auth.passwordResetDone'))
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : t('auth.resetFailed'))
                } finally {
                  setLoading(false)
                }
              }}
            />
          </>
        ) : null}

        {mode === 'lost' ? (
          <>
            <Text style={styles.body}>
              {t('auth.lostCodeHint')}
            </Text>
            <TextField label={t('auth.accountEmail')} value={accountIdentifier} onChangeText={setAccountIdentifier} keyboardType="email-address" />
            <TextField label={t('auth.name')} value={requesterName} onChangeText={setRequesterName} autoCapitalize="words" />
            <TextField label={t('auth.contact')} value={contact} onChangeText={setContact} />
            <TextField label={t('auth.situationOptional')} value={message} onChangeText={setMessage} multiline />
            <Button
              label={t('auth.requestAdminRecovery')}
              loading={loading}
              onPress={async () => {
                setError(null)
                setSuccess(null)
                if (accountIdentifier.trim().length < 3 || !requesterName.trim() || contact.trim().length < 3) {
                  setError(t('auth.recoveryFieldsRequired'))
                  return
                }
                setLoading(true)
                try {
                  await authApi.createRecoveryHelpRequest({
                    accountIdentifier: accountIdentifier.trim(),
                    requesterName: requesterName.trim(),
                    contact: contact.trim(),
                    message: message.trim() || undefined,
                  })
                  setSuccess(t('auth.recoveryRequested'))
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : t('auth.requestFailed'))
                } finally {
                  setLoading(false)
                }
              }}
            />
          </>
        ) : null}

        <Button label={t('auth.backToLogin')} variant="secondary" onPress={() => router.replace('/(auth)/login')} />
      </KeyboardAvoidingView>
    </Screen>
  )
}

function ModeChip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipOn]} accessibilityRole="button">
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  box: { gap: 12, paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  body: { color: colors.muted, lineHeight: 22, fontSize: 14 },
  modes: { flexDirection: 'row', gap: 6 },
  chip: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  chipOn: { borderColor: colors.purple, backgroundColor: colors.heroStart },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.muted, textAlign: 'center' },
  chipTextOn: { color: colors.purple },
  hint: { color: colors.purple, fontWeight: '600' },
  ok: { color: '#166534', lineHeight: 20 },
  error: { color: colors.dangerText, lineHeight: 20 },
})
