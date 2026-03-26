import { create } from 'zustand'

const EMPTY_AUTH_STATE = {
  accessToken: null,
  userId: null,
  role: null,
} as const

function readSessionFromStorage(): Pick<AuthState, 'accessToken' | 'userId' | 'role'> {
  if (typeof window === 'undefined') {
    return { ...EMPTY_AUTH_STATE }
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
  /** localStorage + 메모리 세션 제거 (401·로그아웃 공통). idempotent. */
  clearAuth: () => void
}

function clearStorageSession() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('accessToken')
  localStorage.removeItem('auth_token')
  localStorage.removeItem('token')
  localStorage.removeItem('userRole')
  localStorage.removeItem('userId')
  window.dispatchEvent(new Event('auth-change'))
}

/**
 * 로그인 세션 스냅샷 (localStorage SSOT).
 * 초기 렌더는 서버/클라이언트가 동일해야 하므로 create 시점에는 storage를 읽지 않고,
 * 마운트 후 AuthSync가 localStorage 값을 주입한다.
 */
export const useAuthStore = create<AuthState>((set) => ({
  ...EMPTY_AUTH_STATE,
  syncFromStorage: () => set(readSessionFromStorage()),
  clearAuth: () => {
    clearStorageSession()
    set({ ...EMPTY_AUTH_STATE })
  },
}))
