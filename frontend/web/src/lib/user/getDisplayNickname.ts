/**
 * 공개 화면 표시명. 최종 목표는 nickname 단일 SSOT이며, 마이그레이션 기간 동안만 폴백.
 */
export function getDisplayNickname(user: {
  nickname?: string | null
  /** 백엔드 /auth/me 등에서 name 필드 */
  name?: string | null
  legalName?: string | null
  email?: string | null
  displayName?: string | null
}): string {
  const nick = user.nickname?.trim()
  if (nick) return nick
  const dn = user.displayName?.trim()
  if (dn) return dn
  const legal = user.legalName?.trim() || user.name?.trim()
  if (legal) return legal
  const em = user.email?.trim()
  if (em) {
    const at = em.indexOf('@')
    if (at > 0) return em.slice(0, at)
  }
  return '사용자'
}
