'use client'

import { useTranslations } from 'next-intl'
import {
  EMPTY_SIGNUP_CONSENTS,
  APPLICANT_SIGNUP_GENDERS,
  applicantSignupGenderValid,
  birthDateProblem,
  signupConsentMissing,
  type SignupConsentState,
} from '@/shared/privacy/model'

export type SignupExtras = { birthDate: string; gender: string; consents: SignupConsentState }
export const EMPTY_SIGNUP_EXTRAS: SignupExtras = { birthDate: '', gender: '', consents: EMPTY_SIGNUP_CONSENTS }

/** 가입 폼 공통 검증. 문제 없으면 null, 있으면 consent.* 메시지 키. */
export function signupExtrasErrorKey(v: SignupExtras, applicant: boolean): string | null {
  if (applicant) {
    const p = birthDateProblem(v.birthDate)
    if (p) return p === 'required' ? 'birthDateRequired' : 'birthDateInvalid'
    if (!applicantSignupGenderValid(v.gender)) return 'genderRequired'
  }
  if (signupConsentMissing(v.consents, applicant)) return 'required'
  return null
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  height: 44,
  borderRadius: 8,
  border: '1px solid #ddd',
  padding: '0 12px',
  fontSize: 14,
  background: 'white',
}

/**
 * PC·모바일 웹 가입 공통: 생년월일·성별(지원자 필수)·분리 동의.
 * 보호자 동의는 여기서 받지 않는다(본인 체크 ≠ 보호자 동의). 네이티브 register.tsx 와 같은 항목·순서.
 */
export function SignupConsentFields({
  value,
  onChange,
  applicant,
  askPersonal = applicant,
}: {
  value: SignupExtras
  onChange: (next: SignupExtras) => void
  applicant: boolean
  /** false 면 생년월일·성별은 폼이 따로 받는다(모바일 웹 기존 필드). */
  askPersonal?: boolean
}) {
  const t = useTranslations('consent')
  const tr = useTranslations('register')
  const keys: (keyof SignupConsentState)[] = applicant
    ? ['terms', 'privacyCollection', 'privacyDisclosure', 'marketing']
    : ['terms', 'privacyCollection', 'marketing']
  const all = keys.every((k) => value.consents[k])
  const setConsents = (consents: SignupConsentState) => onChange({ ...value, consents })
  return (
    <div data-testid="signup-consents" style={{ display: 'grid', gap: 10, margin: '12px 0' }}>
      {askPersonal ? (
        <>
          <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 500 }}>
            {t('birthDate')} *
            <input
              id="birthDate"
              type="date"
              onClick={(event) => event.currentTarget.showPicker?.()}
              value={value.birthDate}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => onChange({ ...value, birthDate: e.target.value })}
              style={inputStyle}
            />
            <span style={{ fontSize: 12, color: '#666', fontWeight: 400 }}>{t('birthDateHint')}</span>
          </label>
          <label style={{ display: 'grid', gap: 6, fontSize: 14, fontWeight: 500 }}>
            {t('gender')} *
            <select id="gender" aria-required="true" value={value.gender} onChange={(e) => onChange({ ...value, gender: e.target.value })} style={inputStyle}>
              <option value="" disabled>{tr('pickGender')}</option>
              {APPLICANT_SIGNUP_GENDERS.map((g) => (
                <option key={g} value={g}>
                  {tr(g === 'MALE' ? 'male' : 'female')}
                </option>
              ))}
            </select>
          </label>
        </>
      ) : null}
      <fieldset style={{ border: '1px solid #e5e5e5', borderRadius: 10, padding: 12, display: 'grid', gap: 8 }}>
        <legend style={{ fontSize: 14, fontWeight: 700, padding: '0 4px' }}>{t('title')}</legend>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, fontWeight: 700 }}>
          <input
            type="checkbox"
            data-testid="consent-all"
            checked={all}
            onChange={() => setConsents(keys.reduce((acc, k) => ({ ...acc, [k]: !all }), { ...value.consents }))}
          />
          {t('agreeAll')}
        </label>
        {keys.map((k) => (
          <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, lineHeight: 1.5 }}>
            <input
              type="checkbox"
              data-testid={`consent-${k}`}
              checked={value.consents[k]}
              onChange={() => setConsents({ ...value.consents, [k]: !value.consents[k] })}
            />
            {t(k)}
          </label>
        ))}
        {applicant ? <p style={{ margin: 0, fontSize: 12, color: '#666', lineHeight: 1.6 }}>{t('guardianNotice')}</p> : null}
      </fieldset>
    </div>
  )
}
