'use client'

import type { ReactNode } from 'react'
import { Link, usePathname } from '@/i18n.config'
import { useAuthStore } from '@/lib/auth/authStore'

const NAV_ITEMS = [
  { href: '/my/dashboard', label: '요약', match: (p: string) => p === '/my/dashboard' },
  { href: '/my/auditions', label: '오디션 관리', match: (p: string) => p.startsWith('/my/auditions') },
  { href: '/my/applicants', label: '지원자 관리', match: (p: string) => p.startsWith('/my/applicants') },
  { href: '/my/stats', label: '통계', match: (p: string) => p === '/my/stats' },
  { href: '/my/profile', label: '설정', match: (p: string) => p === '/my/profile' },
] as const

export function AgencyDashboardShell({ children }: { children: ReactNode }) {
  const role = useAuthStore((s) => s.role)
  const pathname = usePathname() ?? ''

  if (role !== 'AGENCY' && role !== 'ADMIN') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">기획사 대시보드</p>
          <nav className="mt-2 flex flex-wrap gap-1 text-sm" aria-label="기획사 메뉴">
            {NAV_ITEMS.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 no-underline transition-colors ${
                    active ? 'bg-violet-100 font-semibold text-violet-900' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      {children}
    </div>
  )
}
