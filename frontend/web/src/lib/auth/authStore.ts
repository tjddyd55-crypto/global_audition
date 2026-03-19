import { create } from 'zustand'

function readSessionFromStorage(): Pick<AuthState, 'accessToken' | 'userId' | 'role'> {
  if (typeof window === 'undefined') {
    return { accessToken: null, userId: null, role: null }
  }
  return {
    accessToken:
      localStorage.getItem('accessToken') ||
      localStorage.getItem('auth_token') ||
      localStorage.getItem('token'),
    userId: localStorage.getItem('userId'),
    role: localStorage.getItem('userRole'),
  }
}

type AuthState = {
  accessToken: string | null
  userId: string | null
  role: string | null
  syncFromStorage: () => void
}

/**
 * 로그인 세션 스냅샷 (localStorage SSOT). apiClient 인터셉터와 별개로 UI가 즉시 반응하도록 사용.
 */
export const useAuthStore = create<AuthState>((set) => ({
  ...readSessionFromStorage(),
  syncFromStorage: () => set(readSessionFromStorage()),
}))
