'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '../../i18n.config'
import { authApi } from '../../lib/api/auth'
import { userApi } from '../../lib/api/user'
import { HEADER } from '../../lib/design-tokens'

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
    const syncToken = () => setToken(authApi.getToken())
    syncToken()
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'accessToken' || e.key === 'auth_token') syncToken()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
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
    if (segments[1] && locales.includes(segments[1] as (typeof locales)[number])) segments[1] = nextLocale
    else segments.splice(1, 0, nextLocale)
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

  const headerStyle: React.CSSProperties = {
    height: HEADER.heightPx,
    paddingLeft: HEADER.paddingPx,
    paddingRight: HEADER.paddingPx,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#ffffff',
    borderBottom: `1px solid ${HEADER.borderColor}`,
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div style={headerStyle}>
        <Link href="/" className="flex items-center gap-2 shrink-0" style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: HEADER.logoSizePx,
              height: HEADER.logoSizePx,
              borderRadius: '50%',
              background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 700,
              fontSize: 16,
            }}
          >
            G
          </div>
          <span style={{ fontWeight: HEADER.logoFontWeight, fontSize: HEADER.logoFontSizePx, color: '#000' }}>
            글로벌 오디션
          </span>
        </Link>

        <nav className="hidden md:flex" style={{ gap: HEADER.navGapPx }}>
          <Link
            href="/auditions"
            className="transition-colors hover:opacity-90"
            style={{ fontSize: HEADER.navFontSizePx, color: HEADER.navColor, textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = HEADER.navHoverColor }}
            onMouseLeave={(e) => { e.currentTarget.style.color = HEADER.navColor }}
          >
            오디션
          </Link>
          <Link
            href="/channels"
            className="transition-colors hover:opacity-90"
            style={{ fontSize: HEADER.navFontSizePx, color: HEADER.navColor, textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = HEADER.navHoverColor }}
            onMouseLeave={(e) => { e.currentTarget.style.color = HEADER.navColor }}
          >
            채널
          </Link>
          <Link
            href="/videos"
            className="transition-colors hover:opacity-90"
            style={{ fontSize: HEADER.navFontSizePx, color: HEADER.navColor, textDecoration: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = HEADER.navHoverColor }}
            onMouseLeave={(e) => { e.currentTarget.style.color = HEADER.navColor }}
          >
            영상
          </Link>
        </nav>

        <div className="hidden md:flex items-center" style={{ gap: 16 }}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLanguageOpen((p) => !p)}
              style={{ fontSize: 14, color: HEADER.navColor, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              {locale.toUpperCase()}
            </button>
            {isLanguageOpen && (
              <div className="absolute right-0 top-full mt-1 rounded-lg border border-gray-200 bg-white shadow-lg py-1 min-w-[80px]">
                {locales.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeLocale(item)}
                    className="block w-full px-3 py-2 text-left text-sm uppercase hover:bg-gray-50"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!token || !user ? (
            <>
              <Link href="/login" style={{ fontSize: 14, color: '#000', textDecoration: 'none' }}>
                {t('login')}
              </Link>
              <Link
                href="/register"
                style={{
                  height: 36,
                  paddingLeft: 16,
                  paddingRight: 16,
                  borderRadius: 8,
                  background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                {t('register')}
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((p) => !p)}
                className="flex items-center gap-2"
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(90deg, #7c3aed, #ec4899)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {(user?.name ?? '').charAt(0) || '?'}
                </div>
                <span style={{ fontSize: 14 }}>{user?.name ?? '이름 없음'}</span>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
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
          onClick={() => setIsMobileOpen((p) => !p)}
          className="md:hidden flex items-center justify-center w-9 h-9 border border-gray-200 rounded"
          aria-label="메뉴"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {isMobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-6 py-4">
          <div className="flex flex-col gap-2">
            <Link href="/auditions" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm">
              오디션
            </Link>
            <Link href="/channels" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm">
              채널
            </Link>
            <Link href="/videos" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm">
              영상
            </Link>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
            <Link href="/login" onClick={() => setIsMobileOpen(false)} className="flex-1 py-2 text-center text-sm border border-gray-200 rounded">
              {t('login')}
            </Link>
            <Link
              href="/register"
              onClick={() => setIsMobileOpen(false)}
              className="flex-1 py-2 text-center text-sm text-white rounded"
              style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }}
            >
              {t('register')}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
