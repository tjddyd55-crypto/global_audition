'use client'

import { useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '../../i18n.config'
import { authApi } from '../../lib/api/auth'
import { userApi } from '../../lib/api/user'

const locales = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'] as const

export default function MainHeader() {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()

  const [token, setToken] = useState<string | null>(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    const syncToken = () => {
      setToken(authApi.getToken())
    }

    syncToken()

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'auth_token') {
        syncToken()
      }
    }
    const onAuthChange = () => syncToken()

    window.addEventListener('storage', onStorage)
    window.addEventListener('auth-change', onAuthChange)

    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('auth-change', onAuthChange)
    }
  }, [])

  const { data: user } = useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => userApi.getCurrentUser(),
    enabled: Boolean(token),
    retry: false,
    refetchOnWindowFocus: false,
  })

  const changeLocale = (nextLocale: string) => {
    const segments = pathname.split('/')
    if (segments[1] && locales.includes(segments[1] as (typeof locales)[number])) {
      segments[1] = nextLocale
    } else {
      segments.splice(1, 0, nextLocale)
    }
    router.push(segments.join('/'))
    setIsLanguageOpen(false)
    setIsMobileOpen(false)
  }

  const handleLogout = () => {
    authApi.logout()
    queryClient.removeQueries({ queryKey: ['currentUser'] })
    setToken(null)
    setIsUserMenuOpen(false)
    setIsMobileOpen(false)
    router.push('/')
  }

  const logo = useMemo(
    () => (
      <Link href="/" className="flex items-center gap-2 whitespace-nowrap">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600">
          <span className="text-sm font-bold text-white">G</span>
        </div>
        <span className="text-base font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
          글로벌 오디션
        </span>
      </Link>
    ),
    []
  )

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="relative flex h-16 items-center justify-between">
          {logo}

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 md:flex">
            <Link href="/auditions" className="text-sm font-medium text-gray-900 hover:text-purple-600">
              오디션
            </Link>
            <Link href="/channels" className="text-sm font-medium text-gray-900 hover:text-purple-600">
              채널
            </Link>
            <Link href="/videos" className="text-sm font-medium text-gray-900 hover:text-purple-600">
              영상
            </Link>
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLanguageOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18"
                  />
                </svg>
                <span className="uppercase">{locale}</span>
              </button>

              {isLanguageOpen && (
                <div className="absolute right-0 top-7 z-20 w-24 rounded-lg border border-gray-200 bg-white shadow-lg">
                  {locales.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => changeLocale(item)}
                      className={`block w-full px-3 py-2 text-left text-sm uppercase hover:bg-gray-50 ${
                        locale === item ? 'text-purple-600 font-semibold' : 'text-gray-700'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {!token || !user ? (
              <>
                <Link href="/login" className="text-sm font-medium text-gray-900 hover:text-purple-600">
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-9 items-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-3.5 text-sm font-semibold text-white"
                >
                  {t('register')}
                </Link>
              </>
            ) : (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-gray-100"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-xs font-semibold text-white">
                    {user.name.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-800">{user.name}</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-10 z-20 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    <Link href="/profile" className="block px-3 py-2 text-sm hover:bg-gray-50">
                      프로필
                    </Link>
                    <Link href="/channel" className="block px-3 py-2 text-sm hover:bg-gray-50">
                      내 채널
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 md:hidden"
            aria-label="메뉴 열기"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="space-y-2">
            <Link href="/auditions" onClick={() => setIsMobileOpen(false)} className="block py-1.5 text-sm">
              오디션
            </Link>
            <Link href="/channels" onClick={() => setIsMobileOpen(false)} className="block py-1.5 text-sm">
              채널
            </Link>
            <Link href="/videos" onClick={() => setIsMobileOpen(false)} className="block py-1.5 text-sm">
              영상
            </Link>
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <p className="mb-2 text-xs uppercase tracking-wide text-gray-500">Language</p>
            <div className="flex flex-wrap gap-2">
              {locales.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeLocale(item)}
                  className={`rounded border px-2 py-1 text-xs uppercase ${
                    item === locale ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            {!token || !user ? (
              <div className="flex gap-2">
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 py-2 text-sm"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileOpen(false)}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-gradient-to-r from-purple-600 to-pink-600 py-2 text-sm font-semibold text-white"
                >
                  {t('register')}
                </Link>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex w-full items-center justify-center rounded-md border border-red-200 py-2 text-sm text-red-600"
              >
                로그아웃
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
