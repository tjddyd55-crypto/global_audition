export type ApplicantSignupFields = {
  email: string
  password: string
  nickname: string
  name?: string
  countryCode: string
  timezone?: string
}

export type ApplicantSignupPayload = {
  email: string
  password: string
  role: 'APPLICANT'
  nickname: string
  name?: string
  countryCode?: string
  timezone?: string
}

/** 일반 지원자 가입. 국가·시간대는 UI 언어와 따로 보낸다. */
export function buildApplicantSignupPayload(fields: ApplicantSignupFields): ApplicantSignupPayload {
  const countryCode = fields.countryCode.trim().toUpperCase()
  const timezone = fields.timezone?.trim() ?? ''
  return {
    email: fields.email.trim(),
    password: fields.password,
    role: 'APPLICANT',
    nickname: fields.nickname.trim(),
    name: fields.name?.trim() ? fields.name.trim() : undefined,
    countryCode: countryCode || undefined,
    timezone: timezone || undefined,
  }
}
