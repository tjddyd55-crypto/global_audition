/**
 * 공고 수정·지원자 목록 등 "관리" UI 노출 기준.
 * - ADMIN: 모든 공고
 * - AGENCY: 본인(ownerId) 공고만 (타 기획사 공고 수정 불가)
 *
 * 백엔드 권한과 반드시 함께 검증해야 하며, 프론트는 UX용 게이트만 담당한다.
 */
export function canManageAudition(opts: {
  accessToken: string | null | undefined
  userId: string | null | undefined
  ownerId: string | undefined | null
  role: string | null | undefined
}): boolean {
  const { accessToken, userId, ownerId, role } = opts
  if (!accessToken || !userId || !ownerId) return false
  if (role === 'ADMIN') return true
  if (role === 'AGENCY' && userId === ownerId) return true
  return false
}
