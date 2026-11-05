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
import { useTranslation } from 'react-i18next'

export default function RegisterScreen() {
  const { t } = useTranslation()
  const router = useRouter()
  const { signup } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [name, setName] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('')
  const [representativeName, setRepresentativeName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [businessCity, setBusinessCity] = useState('')
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
        <Text style={styles.title}>{t('auth.registerTitle')}</Text>
        <Text style={styles.hint}>{t('auth.signupHint')}</Text>
        <View style={styles.roles}>
          <RoleChip label={t('auth.applicant')} selected={role === 'APPLICANT'} onPress={() => setRole('APPLICANT')} />
          <RoleChip label={t('auth.business')} selected={role === 'AGENCY'} onPress={() => setRole('AGENCY')} />
        </View>
        <TextField label={t('auth.nickname')} value={nickname} onChangeText={setNickname} />
        <TextField label={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <TextField label={t('auth.passwordMin6')} value={password} onChangeText={setPassword} secureTextEntry />
        {role === 'AGENCY' ? (
          <>
            <TextField label={t('auth.agencyCountry')} value={countryCode} onChangeText={(v) => setCountryCode(v.toUpperCase())} autoCapitalize="characters" />
            <TextField label={t('register.companyName')} value={companyName} onChangeText={setCompanyName} />
            <TextField label={t('register.legalName')} value={legalName} onChangeText={setLegalName} />
            <TextField label={t('register.representativeName')} value={representativeName} onChangeText={setRepresentativeName} />
            <TextField label={t('register.businessRegistrationNumber')} value={businessRegistrationNumber} onChangeText={setBusinessRegistrationNumber} />
            <TextField label={t('register.enterCity')} value={businessCity} onChangeText={setBusinessCity} />
            <TextField label={t('register.contactPhone')} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
          </>
        ) : (
          <TextField label={t('auth.legalNameOptional')} value={name} onChangeText={setName} autoCapitalize="words" />
        )}
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
              name: role === 'AGENCY' ? legalName.trim() || undefined : name.trim() || undefined,
              countryCode: role === 'AGENCY' ? countryCode.trim().toUpperCase() : undefined,
              companyName: role === 'AGENCY' ? companyName.trim() || undefined : undefined,
              legalName: role === 'AGENCY' ? legalName.trim() || undefined : undefined,
              businessRegistrationNumber: role === 'AGENCY' ? businessRegistrationNumber.trim() || undefined : undefined,
              representativeName: role === 'AGENCY' ? representativeName.trim() || undefined : undefined,
              contactPhone: role === 'AGENCY' ? contactPhone.trim() || undefined : undefined,
              businessCity: role === 'AGENCY' ? businessCity.trim() || undefined : undefined,
            }
            const localError = validateSignupDraft(draft)
            if (localError) {
              setError(localError)
              return
            }
            if (role === 'AGENCY') {
              if (!/^[A-Z]{2}$/.test(draft.countryCode || '')) {
                setError(t('auth.agencyCountry'))
                return
              }
              if (!draft.companyName) {
                setError(t('validation.companyNameRequired'))
                return
              }
              if (!draft.legalName) {
                setError(t('validation.legalNameRequired'))
                return
              }
              if (!draft.representativeName) {
                setError(t('validation.representativeNameRequired'))
                return
              }
              if (!draft.businessRegistrationNumber) {
                setError(t('validation.businessRegistrationNumberRequired'))
                return
              }
              if (!draft.businessCity) {
                setError(t('validation.cityRequired'))
                return
              }
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
