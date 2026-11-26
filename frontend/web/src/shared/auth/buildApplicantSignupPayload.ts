import { signupConsentBody, type SignupConsentState } from '../privacy/model'

export type ApplicantSignupFields = {
  inviteCode?: string
  email: string
  password: string
  nickname: string
  name?: string
  countryCode: string
  timezone?: string
  /** YYYY-MM-DD. 지원자 필수(서버 BIRTH_DATE_REQUIRED). 미성년자 판정은 서버가 국가 정책으로 한다. */
  birthDate?: string
  gender?: string
  consents?: SignupConsentState
}

export type ApplicantSignupPayload = {
  inviteCode?: string
  email: string
  password: string
  role: 'APPLICANT'
  nickname: string
  name?: string
  countryCode?: string
  timezone?: string
  birthDate?: string
  gender?: string
  agreeTerms?: boolean
  agreePrivacyCollection?: boolean
  agreePrivacyDisclosure?: boolean
  agreeMarketing?: boolean
}

/** 일반 지원자 가입. 국가·시간대는 UI 언어와 따로 보낸다. */
export function buildApplicantSignupPayload(fields: ApplicantSignupFields): ApplicantSignupPayload {
  const countryCode = fields.countryCode.trim().toUpperCase()
  const timezone = fields.timezone?.trim() ?? ''
  return {
    ...(fields.inviteCode ? { inviteCode: fields.inviteCode } : {}),
    email: fields.email.trim(),
    password: fields.password,
    role: 'APPLICANT',
    nickname: fields.nickname.trim(),
    name: fields.name?.trim() ? fields.name.trim() : undefined,
    countryCode: countryCode || undefined,
    timezone: timezone || undefined,
    birthDate: fields.birthDate?.trim() || undefined,
    gender: fields.gender?.trim() || undefined,
    ...(fields.consents ? signupConsentBody(fields.consents) : {}),
  }
}
