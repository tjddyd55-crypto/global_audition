'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { routing } from '@/i18n.config'
import { authApi } from '@/lib/api/auth'
import { userApi } from '@/lib/api/user'
import { useAuthStore } from '@/lib/auth/authStore'

const LOGIN_BASE = `/${routing.defaultLocale}/login`

type SuperAdminAuthGateProps = {
  children: ReactNode
}

/**
 * 로케일 없는 `/admin/super/*` 전용.
 * 토큰·/auth/me·SUPER_ADMIN 검사 후에만 children 렌더.
 */
export function SuperAdminAuthGate({ children }: SuperAdminAuthGateProps) {
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
    staleTime: 30_000,
  })

  const jwtRoleHint = useMemo(() => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('userRole')
  }, [mounted, me?.role])

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        로딩 중…
      </div>
    )
  }

  if (!hasToken) {
    const next = encodeURIComponent(pathname || '/admin/super')
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <AdminNotice title="로그인 필요">
          <p className="mb-4 text-gray-600">
            슈퍼관리자 콘솔은 로그인 후 이용할 수 있습니다. API 호출에 Bearer 토큰이 필요합니다.
          </p>
          <Link href={`${LOGIN_BASE}?next=${next}`} className="font-semibold text-violet-700 underline">
            로그인으로 이동
          </Link>
        </AdminNotice>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        세션 확인 중…
      </div>
    )
  }

  if (isError || !me) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <AdminNotice title="세션 오류">
          <p className="mb-4 text-gray-600">
            사용자 정보를 불러오지 못했습니다. 토큰이 만료되었거나 잘못되었을 수 있습니다. 다시 로그인해 주세요.
          </p>
          <Link href={LOGIN_BASE} className="font-semibold text-violet-700 underline">
            로그인
          </Link>
        </AdminNotice>
      </div>
    )
  }

  if (me.role !== 'SUPER_ADMIN') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <AdminNotice title="접근 거부">
          <p className="mb-4 text-gray-600">
            슈퍼관리자(SUPER_ADMIN)만 이 영역에 접근할 수 있습니다. 현재 역할: <strong>{me.role}</strong>
          </p>
          {jwtRoleHint && jwtRoleHint !== me.role && (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              로그인 시점 JWT 역할({jwtRoleHint})과 서버 프로필({me.role})이 다릅니다. DB에서 role을 바꾼 경우{' '}
              <strong>로그아웃 후 다시 로그인</strong>하면 토큰에 반영됩니다.
            </p>
          )}
          <p className="text-sm text-gray-500">
            DB 확인:{' '}
            <code className="rounded bg-gray-100 px-1">SELECT email, role FROM users WHERE email = &apos;…&apos;;</code>
          </p>
          <p className="mt-4">
            <Link href={`/${routing.defaultLocale}`} className="text-sm font-medium text-violet-700 underline">
              홈으로
            </Link>
          </p>
        </AdminNotice>
      </div>
    )
  }

  return <>{children}</>
}

function AdminNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h1 className="mb-3 text-lg font-bold text-gray-900">{title}</h1>
      <div className="text-sm text-gray-600">{children}</div>
    </section>
  )
}
