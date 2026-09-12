'use client'

import { Link, usePathname } from '@/i18n.config'
import { useTranslations } from 'next-intl'
import { useMemo } from 'react'

type TabItem = {
  key: string
  label: string
  href: string
  /** 현재 경로가 이 prefix로 시작하면 활성으로 간주 */
  matchPrefix: string
  icon: React.ReactNode
}

/**
 * 하단 고정 탭바 (홈 / 오디션 / 마이 / 프로필).
 *
 * - 경로 매칭은 `usePathname`(next-intl)으로 하고, locale prefix는 자동 제거된다.
 * - safe-area는 본 파일이 아니라 호스트 컨테이너(`MobileShell`)에서 지정.
 */
export function BottomTabBar() {
  const pathname = usePathname() || '/'
  const t = useTranslations('nav')

  const tabs: TabItem[] = useMemo(
    () => [
      {
        key: 'home',
        label: t('home'),
        href: '/',
        matchPrefix: '/',
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 9v11h14V9" strokeLinejoin="round" />
          </svg>
        ),
      },
      {
        key: 'auditions',
        label: t('auditions'),
        href: '/auditions',
        matchPrefix: '/auditions',
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M10 9l5 3-5 3V9z" fill="currentColor" stroke="none" />
          </svg>
        ),
      },
      {
        key: 'my',
        label: t('applications'),
        href: '/my/applications',
        matchPrefix: '/my',
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 7h16M4 12h10M4 17h16" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        key: 'profile',
        label: t('profile'),
        href: '/profile',
        matchPrefix: '/profile',
        icon: (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
    [t],
  )

  return (
    <nav
      aria-label="mobile-bottom-tab"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-4 text-center">
        {tabs.map((tab) => {
          const active = isTabActive(pathname, tab.matchPrefix)
          return (
            <li key={tab.key}>
              <Link
                href={tab.href}
                className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs leading-tight ${active ? 'text-neutral-900' : 'text-neutral-500'} no-underline`}
              >
                <span aria-hidden>{tab.icon}</span>
                <span className="max-w-[72px] whitespace-normal break-words text-center">{tab.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function isTabActive(pathname: string, prefix: string): boolean {
  if (prefix === '/') return pathname === '/' || pathname === ''
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}
