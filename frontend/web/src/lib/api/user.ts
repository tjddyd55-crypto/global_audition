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
      displayName?: string
      role: string
      profileImageUrl?: string | null
    }>(data)
    return {
      userId: raw.id,
      email: raw.email,
      role: raw.role === 'USER' ? 'APPLICANT' : raw.role,
      name: raw.displayName ?? raw.username ?? null,
      profileImageUrl: raw.profileImageUrl ?? null,
    }
  },
}
