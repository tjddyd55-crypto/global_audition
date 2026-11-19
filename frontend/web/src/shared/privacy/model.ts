/**
 * 마이프로필 '개인정보 및 공개 설정' · 가입 동의 · 보호자 확인 (네이티브·웹 공용).
 * 서버(/api/me/privacy)가 국가별 미성년자 정책을 판정한다. 클라이언트는 나이 기준을 갖지 않는다.
 */

export const PRIVACY_TOGGLES = [
  'channelPublic',
  'talentSearchVisible',
  'castingOffersEnabled',
  'showAge',
  'showGender',
  'showNationality',
  'showResidence',
  'showBio',
  'showCareer',
  'showSns',
] as const
export type PrivacyToggle = (typeof PRIVACY_TOGGLES)[number]

export const GENDER_CODES = ['FEMALE', 'MALE', 'NON_BINARY', 'UNDISCLOSED'] as const
export const GUARDIAN_RELATIONSHIPS = ['PARENT', 'LEGAL_GUARDIAN', 'OTHER'] as const
export const CONSENT_TYPES = [
  'TERMS_OF_SERVICE',
  'PRIVACY_COLLECTION',
  'PRIVACY_DISCLOSURE',
  'GUARDIAN_CONSENT',
  'MARKETING',
] as const
/** 보호자 링크 유효 기간(서버 GuardianService.LINK_TTL 과 같게). */
export const GUARDIAN_LINK_DAYS = 7

export type MinorStatus = {
  ageKnown: boolean
  minor: boolean
  guardianLegallyRequired: boolean
  guardianConfirmed: boolean
  policyCountry: string
  adultAge: number
  guardianConsentUnderAge: number
  applyAllowed: boolean
  searchAllowed: boolean
  offersAllowed: boolean
  contactSharingAllowed: boolean
  offersBlockReason: string | null
}

export type ConsentRecord = {
  type: string
  termsVersion: string | null
  status: string
  agreedAt: string | null
  withdrawnAt: string | null
  source: string | null
}

export type GuardianState = {
  status: string
  guardianName: string | null
  relationship: string | null
  requestedAt: string | null
  expiresAt: string | null
  confirmedAt: string | null
  revokedAt: string | null
}

export type PrivacySettings = Record<PrivacyToggle, boolean> & {
  gender: string | null
  birthDateSet: boolean
  ageBand: string | null
  minor: MinorStatus
  consents: ConsentRecord[]
  guardian: GuardianState | null
  termsVersion: string | null
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null)
const bool = (v: unknown): boolean => v === true
const num = (v: unknown, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : d)

export function parsePrivacySettings(raw: unknown): PrivacySettings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const m = (r.minor && typeof r.minor === 'object' ? r.minor : {}) as Record<string, unknown>
  const g = r.guardian && typeof r.guardian === 'object' ? (r.guardian as Record<string, unknown>) : null
  const toggles = Object.fromEntries(PRIVACY_TOGGLES.map((k) => [k, bool(r[k])])) as Record<PrivacyToggle, boolean>
  return {
    ...toggles,
    gender: str(r.gender),
    birthDateSet: bool(r.birthDateSet),
    ageBand: str(r.ageBand),
    minor: {
      ageKnown: bool(m.ageKnown),
      minor: bool(m.minor),
      guardianLegallyRequired: bool(m.guardianLegallyRequired),
      guardianConfirmed: bool(m.guardianConfirmed),
      policyCountry: str(m.policyCountry) ?? 'DEFAULT',
      adultAge: num(m.adultAge, 18),
      guardianConsentUnderAge: num(m.guardianConsentUnderAge, 18),
      applyAllowed: m.applyAllowed !== false,
      searchAllowed: m.searchAllowed !== false,
      offersAllowed: bool(m.offersAllowed),
      contactSharingAllowed: bool(m.contactSharingAllowed),
      offersBlockReason: str(m.offersBlockReason),
    },
    consents: Array.isArray(r.consents)
      ? (r.consents as Record<string, unknown>[]).map((c) => ({
          type: String(c.type ?? ''),
          termsVersion: str(c.termsVersion),
          status: String(c.status ?? ''),
          agreedAt: str(c.agreedAt),
          withdrawnAt: str(c.withdrawnAt),
          source: str(c.source),
        }))
      : [],
    guardian: g
      ? {
          status: String(g.status ?? 'PENDING'),
          guardianName: str(g.guardianName),
          relationship: str(g.relationship),
          requestedAt: str(g.requestedAt),
          expiresAt: str(g.expiresAt),
          confirmedAt: str(g.confirmedAt),
          revokedAt: str(g.revokedAt),
        }
      : null,
    termsVersion: str(r.termsVersion),
  }
}

/** 화면 표시용 보호자 상태(NONE 포함). */
export function guardianStatusOf(s: Pick<PrivacySettings, 'guardian' | 'minor'>): string {
  if (s.minor.guardianConfirmed) return 'CONFIRMED'
  return s.guardian?.status ?? 'NONE'
}

/** 이 토글을 지금 켤 수 없는 이유(서버 판정값 기준). 끄는 것은 언제나 가능하다. */
export function toggleBlockReason(s: PrivacySettings, key: PrivacyToggle): string | null {
  if (key === 'talentSearchVisible' && !s.minor.searchAllowed) return 'SEARCH_GUARDIAN_REQUIRED'
  if (key === 'castingOffersEnabled' && !s.minor.offersAllowed) return s.minor.offersBlockReason ?? 'CASTING_GUARDIAN_REQUIRED'
  return null
}

/** 보호자 확인 페이지 URL. 웹 주소 + 로케일 + 토큰. */
export function guardianLink(webBaseUrl: string, locale: string, token: string): string {
  const base = webBaseUrl.replace(/\/+$/, '')
  return `${base}/${encodeURIComponent(locale || 'ko')}/guardian/${encodeURIComponent(token)}`
}

/** 서버 오류 코드 → privacy.errors.* 키. */
export const PRIVACY_ERROR_CODES = [
  'SEARCH_GUARDIAN_REQUIRED',
  'CASTING_GUARDIAN_REQUIRED',
  'CASTING_BIRTH_DATE_REQUIRED',
  'BIRTH_DATE_REQUIRED',
  'GUARDIAN_NOT_NEEDED',
  'GUARDIAN_ALREADY_CONFIRMED',
  'GENDER_INVALID',
  'BIRTH_DATE_LOCKED',
  'MINOR_PAYMENT_GUARDIAN_REQUIRED',
] as const

export function privacyErrorCode(body: unknown): string | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>
  for (const v of [b.code, b.message, b.error, b.reason]) {
    if (typeof v === 'string' && (PRIVACY_ERROR_CODES as readonly string[]).includes(v.trim())) return v.trim()
  }
  return null
}

// ───── 가입 동의 ─────

export type SignupConsentState = {
  terms: boolean
  privacyCollection: boolean
  privacyDisclosure: boolean
  marketing: boolean
}

export const EMPTY_SIGNUP_CONSENTS: SignupConsentState = {
  terms: false,
  privacyCollection: false,
  privacyDisclosure: false,
  marketing: false,
}

/** 필수 동의 누락 여부. 지원자는 공개 범위 안내까지 필수. 보호자 동의는 가입 화면에서 받지 않는다. */
export function signupConsentMissing(c: SignupConsentState, applicant: boolean): boolean {
  void applicant // 공개 범위·마케팅은 선택. 선택 동의 미체크로 가입을 막지 않는다.
  return !c.terms || !c.privacyCollection
}

export function signupConsentBody(c: SignupConsentState): Record<string, boolean> {
  return {
    agreeTerms: c.terms,
    agreePrivacyCollection: c.privacyCollection,
    agreePrivacyDisclosure: c.privacyDisclosure,
    agreeMarketing: c.marketing,
  }
}

/** YYYY-MM-DD, 미래·120세 초과 아님. 나이 기준(미성년 판정)은 서버가 한다. */
export function birthDateProblem(raw: string, today: Date = new Date()): 'required' | 'invalid' | null {
  const v = raw.trim()
  if (!v) return 'required'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'invalid'
  const [y, m, d] = v.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return 'invalid'
  const now = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  if (dt.getTime() > now) return 'invalid'
  if (y < today.getUTCFullYear() - 120) return 'invalid'
  return null
}
