import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../../src/auth/AuthProvider'
import { ApiError } from '../../src/api/http'
import { validateSignupDraft } from '../../src/domain/signupRules'
import { buildApplicantSignupPayload } from '../../../web/src/shared/auth/buildApplicantSignupPayload'
import { Button } from '../../src/ui/Button'
import { RecoveryCodeNotice } from '../../src/ui/RecoveryCodeNotice'
import { Screen } from '../../src/ui/Screen'
import { TextField } from '../../src/ui/TextField'
import { ScrollChipRow } from '../../src/ui/ScrollChipRow'
import {
  EMPTY_SIGNUP_CONSENTS,
  GENDER_CODES,
  birthDateProblem,
  signupConsentBody,
  signupConsentMissing,
  type SignupConsentState,
} from '../../../web/src/shared/privacy/model'
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
  const [timezone, setTimezone] = useState('')
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
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [consents, setConsents] = useState<SignupConsentState>(EMPTY_SIGNUP_CONSENTS)
  const [guardianNext, setGuardianNext] = useState(false)
  const afterSignup = (needsGuardian: boolean) => router.replace(needsGuardian ? '/privacy' : '/(tabs)')

  if (issuedCode) {
    return (
      <Screen>
        <RecoveryCodeNotice recoveryCode={issuedCode} onAcknowledged={() => afterSignup(guardianNext)} />
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
          <>
            <TextField label={t('auth.legalNameOptional')} value={name} onChangeText={setName} autoCapitalize="words" />
            <TextField label={t('register.country')} value={countryCode} onChangeText={(v) => setCountryCode(v.toUpperCase())} autoCapitalize="characters" />
            <TextField label={t('register.timezone')} value={timezone} onChangeText={setTimezone} autoCapitalize="none" />
            <TextField
              label={t('consent.birthDate')}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="2008-03-15"
              keyboardType="numbers-and-punctuation"
            />
            <Text style={styles.small}>{t('consent.birthDateHint')}</Text>
            <Text style={styles.label}>{t('consent.gender')}</Text>
            <ScrollChipRow
              options={['', ...GENDER_CODES]}
              selected={gender}
              onSelect={setGender}
              labelOf={(g) => (g ? t(`privacy.gender_${g}`) : t('privacy.genderNone'))}
            />
          </>
        )}
        <SignupConsents value={consents} onChange={setConsents} applicant={role === 'APPLICANT'} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label={t('auth.registerButton')}
          loading={loading}
          onPress={async () => {
            const applicant = role === 'APPLICANT'
              ? buildApplicantSignupPayload({
                  email: email.trim(),
                  password,
                  nickname: nickname.trim(),
                  name: name.trim() || undefined,
                  countryCode,
                  timezone,
                  birthDate,
                  gender,
                  consents,
                })
              : null
            const draft = {
              email: email.trim(),
              password,
              nickname: nickname.trim(),
              role,
              name: role === 'AGENCY' ? legalName.trim() || undefined : name.trim() || undefined,
              countryCode: role === 'AGENCY' ? countryCode.trim().toUpperCase() : applicant?.countryCode,
              timezone: role === 'APPLICANT' ? applicant?.timezone : undefined,
              companyName: role === 'AGENCY' ? companyName.trim() || undefined : undefined,
              legalName: role === 'AGENCY' ? legalName.trim() || undefined : undefined,
              businessRegistrationNumber: role === 'AGENCY' ? businessRegistrationNumber.trim() || undefined : undefined,
              representativeName: role === 'AGENCY' ? representativeName.trim() || undefined : undefined,
              contactPhone: role === 'AGENCY' ? contactPhone.trim() || undefined : undefined,
              businessCity: role === 'AGENCY' ? businessCity.trim() || undefined : undefined,
              birthDate: applicant?.birthDate,
              gender: applicant?.gender,
              ...signupConsentBody(role === 'AGENCY' ? { ...consents, privacyDisclosure: false } : consents),
            }
            const localError = validateSignupDraft(draft)
            if (localError) {
              setError(localError)
              return
            }
            if (role === 'APPLICANT') {
              const p = birthDateProblem(birthDate)
              if (p) {
                setError(t(p === 'required' ? 'consent.birthDateRequired' : 'consent.birthDateInvalid'))
                return
              }
            }
            if (signupConsentMissing(consents, role === 'APPLICANT')) {
              setError(t('consent.required'))
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
              setGuardianNext(result.guardianRequired)
              if (result.recoveryCode) {
                setIssuedCode(result.recoveryCode)
                return
              }
              afterSignup(result.guardianRequired)
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

/** 약관·개인정보 수집·공개 범위 안내·마케팅을 따로 받는다. 보호자 동의는 여기서 받지 않는다(본인 체크 ≠ 보호자 동의). */
function SignupConsents({
  value,
  onChange,
  applicant,
}: {
  value: SignupConsentState
  onChange: (next: SignupConsentState) => void
  applicant: boolean
}) {
  const { t } = useTranslation()
  const keys: (keyof SignupConsentState)[] = applicant
    ? ['terms', 'privacyCollection', 'privacyDisclosure', 'marketing']
    : ['terms', 'privacyCollection', 'marketing']
  const all = keys.every((k) => value[k])
  return (
    <View style={styles.consentBox} testID="signup-consents">
      <Text style={styles.label}>{t('consent.title')}</Text>
      <Check
        label={t('consent.agreeAll')}
        on={all}
        strong
        onPress={() => onChange(keys.reduce((acc, k) => ({ ...acc, [k]: !all }), { ...value }))}
      />
      {keys.map((k) => (
        <Check key={k} label={t(`consent.${k}`)} on={value[k]} onPress={() => onChange({ ...value, [k]: !value[k] })} />
      ))}
      {applicant ? <Text style={styles.small}>{t('consent.guardianNotice')}</Text> : null}
    </View>
  )
}

function Check({ label, on, onPress, strong }: { label: string; on: boolean; onPress: () => void; strong?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={styles.check}>
      <View style={[styles.box2, on && styles.box2On]}>{on ? <Text style={styles.tick}>✓</Text> : null}</View>
      <Text style={[styles.checkText, strong && styles.checkStrong]}>{label}</Text>
    </Pressable>
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
  small: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text },
  consentBox: {
    gap: 8,
    padding: 12,
    borderRadius: radius.button,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  check: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 36 },
  box2: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box2On: { backgroundColor: colors.purple, borderColor: colors.purple },
  tick: { color: '#fff', fontWeight: '800', fontSize: 14 },
  checkText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 19 },
  checkStrong: { fontWeight: '800' },
})
