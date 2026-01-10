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

  socialLogin: async (provider: 'GOOGLE' | 'KAKAO' | 'NAVER' | 'FACEBOOK', accessToken: string, userType?: 'APPLICANT' | 'BUSINESS'): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/social/login', {
      provider,
      accessToken,
      userType: userType || 'APPLICANT',
    })
    if (typeof window !== 'undefined' && data.token) {
      localStorage.setItem('auth_token', data.token)
    }
    return data
  },
}
