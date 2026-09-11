import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../src/auth/AuthProvider'
import { ApiError } from '../../src/api/http'
import { Button } from '../../src/ui/Button'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { colors, radius } from '../../src/theme/tokens'

export default function RegisterScreen() {
  const router = useRouter()
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [role, setRole] = useState<'APPLICANT' | 'AGENCY'>('APPLICANT')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <Screen>
      <Text style={styles.title}>회원가입</Text>
      <View style={styles.roles}>
        <RoleChip label="지원자" selected={role === 'APPLICANT'} onPress={() => setRole('APPLICANT')} />
        <RoleChip label="기획사" selected={role === 'AGENCY'} onPress={() => setRole('AGENCY')} />
      </View>
      <TextField label="닉네임" value={nickname} onChangeText={setNickname} />
      <TextField label="이메일" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextField label="비밀번호" value={password} onChangeText={setPassword} secureTextEntry />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Button
        label="가입하기"
        loading={loading}
        onPress={async () => {
          setError(null)
          setLoading(true)
          try {
            await signup({ email: email.trim(), password, nickname: nickname.trim(), role })
            router.replace('/(tabs)')
          } catch (err) {
            setError(err instanceof ApiError ? err.message : '가입에 실패했습니다.')
          } finally {
            setLoading(false)
          }
        }}
      />
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
  title: { fontSize: 24, fontWeight: '800', marginBottom: 16, color: colors.text },
  roles: { flexDirection: 'row', gap: 8, marginBottom: 12 },
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
  error: { color: colors.dangerText, marginVertical: 8 },
})
