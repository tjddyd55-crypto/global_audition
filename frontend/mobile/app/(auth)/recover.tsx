import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { authApi } from '../../src/api/endpoints'
import { ApiError } from '../../src/api/http'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { colors, radius } from '../../src/theme/tokens'

type Mode = 'identify' | 'reset' | 'lost'

export default function RecoverScreen() {
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
        <Text style={styles.title}>계정 찾기 / 비밀번호 재설정</Text>
        <View style={styles.modes}>
          <ModeChip label="아이디 찾기" selected={mode === 'identify'} onPress={() => setMode('identify')} />
          <ModeChip label="비밀번호 재설정" selected={mode === 'reset'} onPress={() => setMode('reset')} />
          <ModeChip label="코드 분실" selected={mode === 'lost'} onPress={() => setMode('lost')} />
        </View>
        {hint ? <Text style={styles.hint}>확인된 계정: {hint}</Text> : null}
        {success ? <Text style={styles.ok}>{success}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {mode === 'identify' ? (
          <>
            <TextField label="복구 보안 코드" value={recoveryCode} onChangeText={setRecoveryCode} autoCapitalize="characters" />
            <Button
              label="계정 확인"
              loading={loading}
              onPress={async () => {
                setError(null)
                setSuccess(null)
                setLoading(true)
                try {
                  const res = await authApi.identifyByRecoveryCode(recoveryCode)
                  setHint(res.accountIdentifier)
                  setAccountIdentifier(res.accountIdentifier)
                  setSuccess('계정 식별자를 확인했습니다. 비밀번호를 재설정할 수 있습니다.')
                  setMode('reset')
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : '복구 코드를 확인할 수 없습니다.')
                } finally {
                  setLoading(false)
                }
              }}
            />
          </>
        ) : null}

        {mode === 'reset' ? (
          <>
            <TextField label="복구 보안 코드" value={recoveryCode} onChangeText={setRecoveryCode} autoCapitalize="characters" />
            <TextField label="새 비밀번호 (6자 이상)" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <TextField label="새 비밀번호 확인" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            <Button
              label="새 비밀번호 설정"
              loading={loading}
              onPress={async () => {
                setError(null)
                setSuccess(null)
                if (newPassword.length < 6) {
                  setError('비밀번호는 최소 6자입니다.')
                  return
                }
                if (newPassword !== confirmPassword) {
                  setError('비밀번호가 일치하지 않습니다.')
                  return
                }
                setLoading(true)
                try {
                  if (!hint) {
                    const id = await authApi.identifyByRecoveryCode(recoveryCode)
                    setHint(id.accountIdentifier)
                  }
                  await authApi.resetPasswordWithRecoveryCode(recoveryCode, newPassword)
                  setSuccess('새 비밀번호가 설정되었습니다. 이전 비밀번호는 알 수 없습니다. 새 비밀번호로 로그인하세요.')
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : '재설정에 실패했습니다.')
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
              관리자에게 복구 요청을 보냅니다. 관리자는 비밀번호를 임의로 지정하지 않고, 본인 확인 후 새 복구 코드를
              재발급합니다.
            </Text>
            <TextField label="계정 이메일" value={accountIdentifier} onChangeText={setAccountIdentifier} keyboardType="email-address" />
            <TextField label="이름" value={requesterName} onChangeText={setRequesterName} autoCapitalize="words" />
            <TextField label="연락처" value={contact} onChangeText={setContact} />
            <TextField label="상황 설명 (선택)" value={message} onChangeText={setMessage} multiline />
            <Button
              label="관리자 복구 요청"
              loading={loading}
              onPress={async () => {
                setError(null)
                setSuccess(null)
                if (accountIdentifier.trim().length < 3 || !requesterName.trim() || contact.trim().length < 3) {
                  setError('계정·이름·연락처를 입력해 주세요.')
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
                  setSuccess('복구 요청이 전달되었습니다. 관리자가 코드를 재발급한 뒤 안내합니다.')
                } catch (err) {
                  setError(err instanceof ApiError ? err.message : '요청에 실패했습니다.')
                } finally {
                  setLoading(false)
                }
              }}
            />
          </>
        ) : null}

        <Button label="로그인으로" variant="secondary" onPress={() => router.replace('/(auth)/login')} />
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
