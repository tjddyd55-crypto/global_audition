import { apiClient } from './client'
import { unwrapData } from './unwrap'
import type { AuthMeUser } from '../types/authMe'

export const userApi = {
  getCurrentUser: async (): Promise<AuthMeUser> => {
    const { data } = await apiClient.get<unknown>('/auth/me')
    const raw = unwrapData<{
      id: string
      email: string
      username?: string
      nickname?: string
      name?: string | null
      displayName?: string
      role: string
      profileImageUrl?: string | null
    }>(data)
    return {
      userId: raw.id,
      email: raw.email,
      /** 백엔드 SSOT: APPLICANT만 화면용 USER로 내려오므로 APPLICANT로 복원. SUPER_ADMIN 등은 그대로 */
      role: raw.role === 'USER' ? 'APPLICANT' : raw.role,
      nickname: raw.nickname ?? null,
      legalName: raw.name ?? null,
      displayName: raw.displayName ?? null,
      profileImageUrl: raw.profileImageUrl ?? null,
    }
  },
}
