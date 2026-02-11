import { apiClient } from './client'

export interface SignupRequest {
  email: string
  password: string
  role: 'APPLICANT' | 'AGENCY' | 'ADMIN'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  email: string
  role: string
  userId: string
}

export const authApi = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const { data: response } = await apiClient.post<AuthResponse>('/auth/signup', data)
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('accessToken', response.token)
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('userRole', response.role)
      localStorage.setItem('userId', response.userId)
      window.dispatchEvent(new Event('auth-change'))
    }
    return response
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const { data: response } = await apiClient.post<AuthResponse>('/auth/login', data)
    if (typeof window !== 'undefined' && response.token) {
      localStorage.setItem('accessToken', response.token)
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('userRole', response.role)
      localStorage.setItem('userId', response.userId)
      window.dispatchEvent(new Event('auth-change'))
    }
    return response
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('userRole')
      localStorage.removeItem('userId')
      window.dispatchEvent(new Event('auth-change'))
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || localStorage.getItem('auth_token')
    }
    return null
  },

  /** MVP: no backend; shows a message only */
  forgotPassword: async (_data: { email: string }): Promise<{ message: string; resetToken?: string }> => {
    return { message: '비밀번호 재설정 기능은 현재 준비 중입니다. 문의해 주세요.' }
  },

  /** MVP: no backend; rejects so UI shows error */
  findUserId: async (_data: unknown): Promise<{ maskedEmail: string }> => {
    const err = new Error('아이디 찾기 기능은 현재 준비 중입니다.') as Error & { response?: { data?: { message?: string } } }
    err.response = { data: { message: '아이디 찾기 기능은 현재 준비 중입니다.' } }
    throw err
  },

  /** MVP: no backend; stub throws */
  resetPassword: async (_data: { resetToken?: string; token?: string; newPassword: string; confirmPassword?: string }): Promise<void> => {
    const err = new Error('비밀번호 재설정 기능은 현재 준비 중입니다.') as Error & { response?: { data?: { message?: string } } }
    err.response = { data: { message: '비밀번호 재설정 기능은 현재 준비 중입니다.' } }
    throw err
  },
}
