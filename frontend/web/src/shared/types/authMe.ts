/** GET /api/auth/me 응답 (백엔드 AuthMeResponse) */
export type AuthMeUser = {
  userId: string
  email: string
  role: string
  /** 화면 표시 우선 */
  nickname?: string | null
  /** 실명(선택) — UI 비노출 원칙 */
  legalName?: string | null
  /** 닉네임·실명·이메일 폴백 라벨(백엔드 displayName) */
  displayName?: string | null
  profileImageUrl?: string | null
}
