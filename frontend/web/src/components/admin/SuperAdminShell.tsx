'use client'

import type { ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePathname } from 'next/navigation'
import { Link } from '@/i18n.config'
import { userApi } from '@/lib/api/user'
import { LAYOUT } from '@/lib/design-tokens'

const NAV = [
  { href: '/admin/super/credit-policies', label: '크레딧 정책' },
  { href: '/admin/super/credit-packages', label: '크레딧 패키지' },
  { href: '/admin/super/users', label: '유저 크레딧' },
  { href: '/admin/super/credits-bulk', label: '대량 지급' },
  { href: '/admin/super/transactions', label: '거래 내역' },
  { href: '/admin/super/logs', label: '관리 로그' },
] as const

type SuperAdminShellProps = {
  children: ReactNode
}

export function SuperAdminShell({ children }: SuperAdminShellProps) {
  const pathname = usePathname()
  const { data: me, isLoading, isError } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => userApi.getCurrentUser(),
  })

  if (isLoading) {
    return (
      <div style={{ padding: LAYOUT.containerPaddingPx, textAlign: 'center' }}>
        로딩 중…
      </div>
    )
  }

  if (isError || !me) {
    const next = encodeURIComponent(pathname || '/admin/super/credit-policies')
    return (
      <div style={{ padding: LAYOUT.containerPaddingPx, maxWidth: 560, margin: '48px auto' }}>
        <AdminNotice title="로그인 필요">
          <p style={{ marginBottom: 16 }}>슈퍼관리자 메뉴를 보려면 로그인하세요.</p>
          <Link href={`/login?next=${next}`} style={{ color: '#7c3aed', fontWeight: 600 }}>
            로그인으로 이동
          </Link>
        </AdminNotice>
      </div>
    )
  }

  if (me.role !== 'SUPER_ADMIN') {
    return (
      <div style={{ padding: LAYOUT.containerPaddingPx, maxWidth: 560, margin: '48px auto' }}>
        <AdminNotice title="접근 거부">
          <p>슈퍼관리자(SUPER_ADMIN)만 이 영역에 접근할 수 있습니다.</p>
        </AdminNotice>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: `${24}px ${LAYOUT.containerPaddingPx}px 48px`,
        background: '#fafafa',
        minHeight: 'calc(100vh - 64px)',
      }}
    >
      <nav
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          marginBottom: 24,
          maxWidth: LAYOUT.containerMaxWidth,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {NAV.map((item) => {
          const path = item.href.replace(/^\//, '')
          const active = pathname?.includes(path) ?? false
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                background: active ? '#ede9fe' : '#fff',
                color: active ? '#5b21b6' : '#444',
                border: `1px solid ${active ? '#c4b5fd' : '#e5e7eb'}`,
              }}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
      {children}
    </div>
  )
}

function AdminNotice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        padding: 24,
        background: '#fff',
      }}
    >
      <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>{title}</h1>
      <div style={{ fontSize: 14, color: '#555' }}>{children}</div>
    </section>
  )
}
