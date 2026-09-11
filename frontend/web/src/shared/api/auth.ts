import { apiClient } from './client'
import { unwrapData } from './unwrap'
import { useAuthStore } from '@/shared/auth/authStore'

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
  /** 회원가입 응답에만 한 번 포함. 이후 API는 평문을 돌려주지 않는다. */
  recoveryCode?: string | null
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

  identifyByRecoveryCode: async (recoveryCode: string): Promise<{ accountIdentifier: string }> => {
    const { data } = await apiClient.post<unknown>('/auth/recover/identify', { recoveryCode })
    return unwrapData<{ accountIdentifier: string }>(data)
  },

  resetPasswordWithRecoveryCode: async (recoveryCode: string, newPassword: string): Promise<void> => {
    const { data } = await apiClient.post<unknown>('/auth/recover/reset', { recoveryCode, newPassword })
    unwrapData<boolean>(data)
  },

  createRecoveryHelpRequest: async (body: {
    accountIdentifier: string
    requesterName: string
    contact: string
    message?: string
  }) => {
    const { data } = await apiClient.post<unknown>('/auth/recovery-requests', body)
    return unwrapData<{ id: string; status: string }>(data)
  },

  findUserId: async (data: { recoveryCode: string }): Promise<{ maskedEmail: string; accountIdentifier: string }> => {
    const identified = await authApi.identifyByRecoveryCode(data.recoveryCode)
    return { accountIdentifier: identified.accountIdentifier, maskedEmail: identified.accountIdentifier }
  },

  resetPassword: async (data: { recoveryCode: string; newPassword: string }): Promise<void> => {
    await authApi.resetPasswordWithRecoveryCode(data.recoveryCode, data.newPassword)
  },
}
