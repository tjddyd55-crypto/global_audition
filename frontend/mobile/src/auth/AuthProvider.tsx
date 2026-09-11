import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authApi } from '../api/endpoints'
import type { AuthMe, UserRole } from '../api/types'
import { ApiError } from '../api/http'
import { clearSession, readSession, writeSession } from './secureSession'

type SignupInput = { email: string; password: string; nickname: string; role: 'APPLICANT' | 'AGENCY'; name?: string }

type AuthContextValue = {
  ready: boolean
  session: AuthMe | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (input: SignupInput) => Promise<{ recoveryCode: string | null }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<AuthMe | null>(null)

  const hydrate = useCallback(async () => {
    const stored = await readSession()
    if (!stored) {
      setSession(null)
      setReady(true)
      return
    }
    try {
      const me = await authApi.me()
      setSession(me)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearSession()
        setSession(null)
      } else {
        setSession({
          userId: stored.userId,
          email: stored.email ?? '',
          role: (stored.role || 'APPLICANT') as UserRole,
          nickname: stored.nickname ?? null,
        })
      }
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  const persist = useCallback(
    async (response: { token: string; role: string; userId: string; email?: string; nickname?: string }) => {
      await writeSession({
        token: response.token,
        role: response.role,
        userId: response.userId,
        email: response.email,
        nickname: response.nickname,
      })
      const me = await authApi.me()
      setSession(me)
    },
    [],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await authApi.login(email, password)
      await persist(response)
    },
    [persist],
  )

  const signup = useCallback(
    async (input: SignupInput) => {
      const response = await authApi.signup(input)
      await persist(response)
      return { recoveryCode: response.recoveryCode ?? null }
    },
    [persist],
  )

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } catch {
      // 서버 쿠키 정리 실패해도 로컬 세션은 지운다.
    }
    await clearSession()
    queryClient.clear()
    setSession(null)
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      ready,
      session,
      isAuthenticated: Boolean(session),
      login,
      signup,
      logout,
    }),
    [ready, session, login, signup, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용할 수 있습니다.')
  return ctx
}
