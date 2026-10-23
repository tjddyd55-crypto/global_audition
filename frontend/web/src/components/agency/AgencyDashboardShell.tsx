'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Link, usePathname } from '@/i18n.config'
import { useAuthStore } from '@/shared/auth/authStore'

const NAV_HREFS = [
  { href: '/my/dashboard', key: 'navSummary' as const, match: (p: string) => p === '/my/dashboard' },
  { href: '/my/auditions', key: 'navAuditions' as const, match: (p: string) => p.startsWith('/my/auditions') },
  { href: '/my/applicants', key: 'navApplicants' as const, match: (p: string) => p.startsWith('/my/applicants') },
  { href: '/my/stats', key: 'navStats' as const, match: (p: string) => p === '/my/stats' },
  { href: '/my/profile', key: 'navSettings' as const, match: (p: string) => p === '/my/profile' },
]

export function AgencyDashboardShell({ children }: { children: ReactNode }) {
  const t = useTranslations('agency')
  const role = useAuthStore((s) => s.role)
  const pathname = usePathname() ?? ''

  if (role !== 'AGENCY' && role !== 'ADMIN') {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{t('dashboard')}</p>
          <nav className="mt-2 flex flex-wrap gap-1 text-sm" aria-label={t('navAria')}>
            {NAV_HREFS.map((item) => {
              const active = item.match(pathname)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 no-underline transition-colors ${
                    active ? 'bg-violet-100 font-semibold text-violet-900' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t(item.key)}
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
