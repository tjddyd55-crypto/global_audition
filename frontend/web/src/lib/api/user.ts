import { apiClient } from './client'

export interface UserProfile {
  id: number
  email: string
  name: string
  userType: 'APPLICANT' | 'BUSINESS'
  profileImageUrl?: string
  createdAt: string
  updatedAt: string
}

export const userApi = {
  // 현재 로그인한 사용자 정보 조회
  getCurrentUser: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get('/auth/me')
    return data
  },

  // 사용자 프로필 조회
  getUserProfile: async (userId: number): Promise<UserProfile> => {
    const { data } = await apiClient.get(`/auth/users/${userId}`)
    return data
  },
}
