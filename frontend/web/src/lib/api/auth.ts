import { apiClient } from './client'

export interface RegisterRequest {
  email: string
  password: string
  name: string
  userType: 'APPLICANT' | 'BUSINESS'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  userId: number
  email: string
  name: string
  userType: 'APPLICANT' | 'BUSINESS'
  profileImageUrl?: string
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const { data: response } = await apiClient.post('/auth/register', data)
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('auth_token', response.token)
    }
    return response
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const { data: response } = await apiClient.post('/auth/login', data)
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('auth_token', response.token)
    }
    return response
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token')
    }
    return null
  },
}
