'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { routing } from '@/i18n.config'
import { authApi } from '@/shared/api/auth'
import { userApi } from '@/shared/api/user'
import { useAuthStore } from '@/shared/auth/authStore'

const ALLOWED = new Set(['COUNTRY_ADMIN', 'COUNTRY_STAFF'])

export function CountryAdminAuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
    setMounted(true)
  }, [])
  const hasToken = mounted && Boolean(authApi.getToken())
  const { data: me, isLoading, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      useAuthStore.getState().syncFromStorage()
      return userApi.getCurrentUser()
    },
    enabled: hasToken,
  })
  if (!mounted || (hasToken && isLoading)) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">세션 확인 중…</div>
  }
  if (!hasToken || isError || !me) {
    const next = encodeURIComponent(pathname || '/admin/country')
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Link href={`/${routing.defaultLocale}/login?next=${next}`} className="font-semibold text-violet-700 underline">
          로그인으로 이동
        </Link>
      </div>
    )
  }
  if (!ALLOWED.has(me.role)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-sm text-gray-700">
        국가 관리자 또는 국가 직원만 이 화면에 들어올 수 있습니다. 현재 역할: <strong>{me.role}</strong>
      </div>
    )
  }
  return <>{children}</>
}
