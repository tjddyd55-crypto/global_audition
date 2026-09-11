/**
 * 백엔드 SignupRequest + NicknamePolicy 와 동일한 클라이언트 선검사.
 * 서버 검증이 SSOT이며, 여기서는 같은 규칙만 미리 보여 준다.
 */
import i18n from '../i18n'


const NICKNAME_RE = /^[a-zA-Z0-9가-힣._]+$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RESERVED_NICKNAMES = new Set([
  'admin',
  'administrator',
  'root',
  'system',
  'support',
  'official',
  'superadmin',
  'moderator',
  '운영자',
  '관리자',
  'staff',
])

export type SignupDraft = {
  email: string
  password: string
  nickname: string
  role: 'APPLICANT' | 'AGENCY'
  name?: string
}

export function validateSignupDraft(input: SignupDraft): string | null {
  const email = input.email.trim().toLowerCase()
  if (!EMAIL_RE.test(email)) {
    return i18n.t('validation.emailInvalid')
  }
  if (input.password.length < 6) {
    return i18n.t('auth.passwordTooShort')
  }
  const nickname = input.nickname.trim()
  if (nickname.length < 2 || nickname.length > 20) {
    return i18n.t('auth.nicknameLen')
  }
  if (!NICKNAME_RE.test(nickname)) {
    return i18n.t('auth.nicknameCharset')
  }
  if (RESERVED_NICKNAMES.has(nickname.toLowerCase())) {
    return i18n.t('auth.nicknameReserved')
  }
  if (input.role !== 'APPLICANT' && input.role !== 'AGENCY') {
    return i18n.t('auth.roleApplicantOrAgency')
  }
  if (input.name && input.name.trim().length > 120) {
    return i18n.t('auth.legalNameMax')
  }
  return null
}
