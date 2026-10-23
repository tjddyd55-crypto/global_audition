'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '@/i18n.config'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/auth/authStore'
import { PAGE_CONTAINER } from '@/shared/ui/specClasses'

const LINKS = [
  { href: '/my/studio', key: 'dashboard' },
  { href: '/my/studio/profile', key: 'profile' },
  { href: '/my/studio/channel', key: 'channel' },
  { href: '/my/studio/content', key: 'content' },
  { href: '/my/studio/applications', key: 'applications' },
  { href: '/my/studio/credits', key: 'credits' },
  { href: '/my/studio/notifications', key: 'notifications' },
  { href: '/my/studio/settings', key: 'settings' },
] as const

export function StudioFrame({ children }: { children: ReactNode }) {
  const t = useTranslations('studio')
  const locale = useLocale()
  const pathname = usePathname()
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!accessToken && !authApi.getToken()) {
      router.push('/login')
    }
  }, [hydrated, accessToken, router])

  if (!hydrated) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-gray-600">{t('loginRequired')}</div>
  }

  return (
    <div className={`${PAGE_CONTAINER} py-6`}>
      <h1 className="text-lg font-semibold text-gray-900">{t('navLabel')}</h1>
      <nav aria-label={t('navLabel')} className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {LINKS.map((item) => {
          const active = item.href === '/my/studio' ? pathname === '/my/studio' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              locale={locale}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm ${
                active ? 'bg-neutral-900 text-white' : 'border border-neutral-200 text-neutral-800'
              }`}
            >
              {t(item.key)}
            </Link>
          )
        })}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  )
}
