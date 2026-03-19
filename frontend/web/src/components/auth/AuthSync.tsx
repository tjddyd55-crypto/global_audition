'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/lib/auth/authStore'

/** localStorage 세션을 Zustand와 동기화 (로그인 직후·다른 탭·새로고침) */
export function AuthSync() {
  const sync = useAuthStore((s) => s.syncFromStorage)

  useEffect(() => {
    sync()
    const onChange = () => sync()
    window.addEventListener('auth-change', onChange)
    window.addEventListener('storage', onChange)
    return () => {
      window.removeEventListener('auth-change', onChange)
      window.removeEventListener('storage', onChange)
    }
  }, [sync])

  return null
}
