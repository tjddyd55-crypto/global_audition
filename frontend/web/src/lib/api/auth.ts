import { apiClient } from './client'

export interface RegisterRequest {
  // 공통 필드
  email: string
  password: string
  name: string
  userType: 'APPLICANT' | 'BUSINESS'

  // 지망생(APPLICANT) 전용 필드
  country?: string // ISO 3166-1 alpha-2 코드
  city?: string
  birthday?: string // YYYY-MM-DD 형식
  phone?: string
  address?: string
  timezone?: string
  languages?: string[] // 언어 코드 배열
  gender?: string

  // 기획사(BUSINESS) 전용 필드
  businessCountry?: string
  businessCity?: string
  companyName?: string
  legalName?: string
  representativeName?: string
  businessRegistrationNumber?: string
  businessLicenseDocumentUrl?: string
  taxId?: string
  businessAddress?: string
  website?: string
  contactEmail?: string
  contactPhone?: string
  establishedYear?: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token?: string // 기존 필드 (호환성 유지)
  accessToken?: string // 새로운 필드
  refreshToken?: string
  role?: 'APPLICANT' | 'BUSINESS' | 'AGENCY' | 'USER' // role 필드
  userType?: 'APPLICANT' | 'BUSINESS' // 기존 필드 (호환성 유지)
  userId: number
  email: string
  name: string
  profileImageUrl?: string
}

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const { data: response } = await apiClient.post('/auth/register', data)
    
    // 응답 구조 확인 (accessToken 또는 token 필드 지원)
    const token = response.accessToken || response.token
    
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('accessToken', token)
      localStorage.setItem('auth_token', token) // 기존 호환성 유지
      // 커스텀 이벤트 발생하여 Header에 알림
      window.dispatchEvent(new Event('auth-change'))
    }
    return response
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const { data: response } = await apiClient.post('/auth/login', data)
    
    // 응답 구조 확인 (accessToken 또는 token 필드 지원)
    const token = response.accessToken || response.token
    
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('accessToken', token)
      localStorage.setItem('auth_token', token) // 기존 호환성 유지
      
      // 커스텀 이벤트 발생하여 Header에 알림
      window.dispatchEvent(new Event('auth-change'))
    }
    
    return response
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('auth_token') // 기존 호환성 유지
      // 커스텀 이벤트 발생하여 Header에 알림
      window.dispatchEvent(new Event('auth-change'))
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      // accessToken 우선 확인, 없으면 auth_token 확인 (기존 호환성 유지)
      return localStorage.getItem('accessToken') || localStorage.getItem('auth_token')
    }
    return null
  },

  socialLogin: async (provider: 'GOOGLE' | 'KAKAO' | 'NAVER' | 'FACEBOOK', accessToken: string, userType?: 'APPLICANT' | 'BUSINESS'): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/social/login', {
      provider,
      accessToken,
      userType: userType || 'APPLICANT',
    })
    
    // 응답 구조 확인 (accessToken 또는 token 필드 지원)
    const token = data.accessToken || data.token
    
    if (typeof window !== 'undefined' && token) {
      localStorage.setItem('accessToken', token)
      localStorage.setItem('auth_token', token) // 기존 호환성 유지
      // 커스텀 이벤트 발생하여 Header에 알림
      window.dispatchEvent(new Event('auth-change'))
    }
    return data
  },

  findUserId: async (data: { name: string; email: string }): Promise<{ maskedEmail: string }> => {
    const { data: response } = await apiClient.post('/auth/find-user-id', data)
    return response
  },

  forgotPassword: async (data: { email: string }): Promise<{ resetToken?: string; message: string }> => {
    const { data: response } = await apiClient.post('/auth/forgot-password', data)
    return response
  },

  resetPassword: async (data: { resetToken: string; newPassword: string; confirmPassword: string }): Promise<void> => {
    await apiClient.post('/auth/reset-password', data)
  },
}
