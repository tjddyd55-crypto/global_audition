/**
 * 백엔드 SignupRequest + NicknamePolicy 와 동일한 클라이언트 선검사.
 * 서버 검증이 SSOT이며, 여기서는 같은 규칙만 미리 보여 준다.
 */

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
    return '유효한 이메일을 입력해 주세요.'
  }
  if (input.password.length < 6) {
    return '비밀번호는 최소 6자입니다.'
  }
  const nickname = input.nickname.trim()
  if (nickname.length < 2 || nickname.length > 20) {
    return '닉네임은 2~20자여야 합니다.'
  }
  if (!NICKNAME_RE.test(nickname)) {
    return '닉네임은 한글·영문·숫자·밑줄·점만 사용할 수 있습니다.'
  }
  if (RESERVED_NICKNAMES.has(nickname.toLowerCase())) {
    return '사용할 수 없는 닉네임입니다.'
  }
  if (input.role !== 'APPLICANT' && input.role !== 'AGENCY') {
    return '역할은 지원자 또는 기획사만 가능합니다.'
  }
  if (input.name && input.name.trim().length > 120) {
    return '실명은 120자 이하입니다.'
  }
  return null
}
