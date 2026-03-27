import { apiClient } from './client'
import { unwrapData } from './unwrap'
import { useAuthStore } from '@/lib/auth/authStore'

export interface SignupRequest {
  email: string
  password: string
  role: 'APPLICANT' | 'AGENCY'
  nickname: string
  name?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  role: string
  userId: string
  email?: string
  nickname?: string
  profileImageUrl?: string | null
}

export interface AuthMeResponse {
  userId: string
  email: string
  role: 'APPLICANT' | 'AGENCY' | 'ADMIN' | 'SUPER_ADMIN' | 'USER'
  nickname?: string | null
  name?: string | null
  displayName?: string | null
  profileImageUrl?: string | null
}

/**
 * 로그인/가입 직후 토큰·역할을 localStorage + auth 스토어에 반영.
 * DB에서 role을 바꾼 뒤에는 반드시 재로그인해야 한다(JWT는 발급 시점 claim).
 * 메인 로그인 UI는 추가로 `window.location.assign`으로 전체 로드해 옛 메모리 상태와 불일치 403을 줄인다.
 */
function persistAuthToken(response: AuthResponse) {
  if (typeof window === 'undefined' || !response.token) return
  localStorage.setItem('token', response.token)
  localStorage.setItem('accessToken', response.token)
  localStorage.setItem('auth_token', response.token)
  localStorage.setItem('userRole', response.role)
  localStorage.setItem('userId', response.userId)
  window.dispatchEvent(new Event('auth-change'))
  useAuthStore.getState().syncFromStorage()
}

export const authApi = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const { data: response } = await apiClient.post<AuthResponse>('/auth/signup', data)
    persistAuthToken(response)
    return response
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const { data: response } = await apiClient.post<AuthResponse>('/auth/login', data)
    persistAuthToken(response)
    return response
  },

  me: async (): Promise<AuthMeResponse> => {
    const { data } = await apiClient.get<unknown>('/auth/me')
    const raw = unwrapData<{
      id: string
      email: string
      nickname?: string | null
      name?: string | null
      displayName?: string | null
      role: string
      profileImageUrl?: string | null
    }>(data)
    return {
      userId: raw.id,
      email: raw.email,
      nickname: raw.nickname ?? null,
      name: raw.name ?? null,
      displayName: raw.displayName ?? null,
      profileImageUrl: raw.profileImageUrl ?? null,
      role: (raw.role === 'USER' ? 'APPLICANT' : raw.role) as AuthMeResponse['role'],
    }
  },

  /** HttpOnly 세션 쿠키 제거 + 로컬 스토어 초기화 (withCredentials 로 /auth/logout 전달) */
  logout: async () => {
    if (typeof window !== 'undefined') {
      try {
        await apiClient.post('/auth/logout')
      } catch {
        // ignore
      }
    }
    useAuthStore.getState().clearAuth()
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken') || localStorage.getItem('auth_token') || localStorage.getItem('token')
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
