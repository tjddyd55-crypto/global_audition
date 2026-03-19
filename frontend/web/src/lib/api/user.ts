import { apiClient } from './client'
import type { AuthMeUser } from '../types/authMe'

export const userApi = {
  getCurrentUser: async (): Promise<AuthMeUser> => {
    const { data } = await apiClient.get<AuthMeUser>('/auth/me')
    return data
  },
}
