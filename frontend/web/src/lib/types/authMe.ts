/** GET /api/auth/me 응답 (백엔드 AuthMeResponse) */
export type AuthMeUser = {
  userId: string
  email: string
  role: string
  name?: string | null
  profileImageUrl?: string | null
}
