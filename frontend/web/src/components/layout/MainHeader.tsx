'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '../../i18n.config'
import { authApi } from '../../lib/api/auth'
import { userApi } from '../../lib/api/user'
import { HEADER } from '../../lib/design-tokens'
import { useAuthStore } from '@/lib/auth/authStore'

const locales = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'] as const

export default function MainHeader() {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
  }, [])

  const { data: user, isLoading: meLoading } = useQuery({
    queryKey: ['currentUser', accessToken],
    queryFn: () => userApi.getCurrentUser(),
    enabled: Boolean(accessToken),
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
    setIsUserMenuOpen(false)
    setIsMobileOpen(false)
    router.push('/')
  }

  const displayName = user?.name?.trim() || user?.email || '내 계정'
  const loggedIn = Boolean(accessToken)
  /** 토큰 있으면 로그인 UI (me 로딩 중에는 토큰만으로 판단) */
  const showUserChrome = loggedIn && (!meLoading || !!user)

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
      <div className="max-md:!px-4" style={headerStyle}>
        <Link href="/" className="flex min-w-0 items-center gap-2 shrink-0" style={{ textDecoration: 'none' }}>
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
          <span
            className="truncate max-md:max-w-[140px]"
            style={{ fontWeight: HEADER.logoFontWeight, fontSize: HEADER.logoFontSizePx, color: '#000' }}
          >
            글로벌 오디션
          </span>
        </Link>

        <nav className="hidden lg:flex" style={{ gap: HEADER.navGapPx }}>
          <Link
            href="/auditions"
            className="transition-colors hover:opacity-90"
            style={{ fontSize: HEADER.navFontSizePx, color: HEADER.navColor, textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = HEADER.navHoverColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = HEADER.navColor
            }}
          >
            오디션
          </Link>
          <Link
            href="/channels"
            className="transition-colors hover:opacity-90"
            style={{ fontSize: HEADER.navFontSizePx, color: HEADER.navColor, textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = HEADER.navHoverColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = HEADER.navColor
            }}
          >
            채널
          </Link>
          <Link
            href="/videos"
            className="transition-colors hover:opacity-90"
            style={{ fontSize: HEADER.navFontSizePx, color: HEADER.navColor, textDecoration: 'none' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = HEADER.navHoverColor
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = HEADER.navColor
            }}
          >
            영상
          </Link>
        </nav>

        <div className="hidden lg:flex items-center" style={{ gap: 16 }}>
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
          {!showUserChrome ? (
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
                className="flex max-w-[200px] items-center gap-2"
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
                  {displayName.charAt(0) || '?'}
                </div>
                <span className="truncate text-sm">{displayName}</span>
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
          className="lg:hidden flex items-center justify-center w-9 h-9 border border-gray-200 rounded"
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
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-4 shadow-md">
          <div className="flex flex-col gap-1">
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
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="text-xs text-gray-500 mb-2">언어</div>
            <div className="flex flex-wrap gap-2">
              {locales.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeLocale(item)}
                  className="rounded border border-gray-200 px-2 py-1 text-xs uppercase"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
            {showUserChrome ? (
              <>
                <div className="py-1 text-sm font-medium text-gray-900 truncate">{displayName}</div>
                <Link href="/profile" onClick={() => setIsMobileOpen(false)} className="w-full py-3 text-center text-sm border border-gray-200 rounded-lg">
                  프로필
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    handleLogout()
                  }}
                  className="w-full py-3 text-center text-sm text-red-600 border border-red-100 rounded-lg"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full py-3 text-center text-sm border border-gray-200 rounded-lg"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full py-3 text-center text-sm text-white rounded-lg"
                  style={{ background: 'linear-gradient(90deg, #7c3aed, #ec4899)' }}
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
