'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '../../i18n.config'
import { authApi } from '../../lib/api/auth'
import { userApi } from '../../lib/api/user'
import { useAuthStore } from '@/lib/auth/authStore'
import { getDisplayNickname } from '@/lib/user/getDisplayNickname'
import { BTN_PRIMARY, DROPDOWN_ITEM } from '@/lib/ui/specClasses'

const locales = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'] as const

export default function MainHeader() {
  const t = useTranslations('common')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const queryClient = useQueryClient()
  const accessToken = useAuthStore((s) => s.accessToken)
  const userRole = useAuthStore((s) => s.role)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  useEffect(() => {
    if (!accessToken) {
      queryClient.removeQueries({ queryKey: ['currentUser'] })
    }
  }, [accessToken, queryClient])

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
  }, [accessToken])

  const { data: user, isLoading: meLoading } = useQuery({
    queryKey: ['currentUser', accessToken],
    queryFn: () => userApi.getCurrentUser(),
    enabled: Boolean(accessToken),
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
  })

  const changeLocale = (nextLocale: string) => {
    const segments = pathname.split('/')
    if (segments[1] && locales.includes(segments[1] as (typeof locales)[number])) segments[1] = nextLocale
    else segments.splice(1, 0, nextLocale)
    router.push(segments.join('/'))
    setIsLanguageOpen(false)
    setIsMobileOpen(false)
  }

  const handleLogout = async () => {
    await authApi.logout()
    queryClient.removeQueries({ queryKey: ['currentUser'] })
    setIsUserMenuOpen(false)
    setIsMobileOpen(false)
    router.push('/')
  }

  const closeUserMenu = () => setIsUserMenuOpen(false)

  const displayName = user
    ? getDisplayNickname({
        nickname: user.nickname,
        legalName: user.legalName,
        email: user.email,
        displayName: user.displayName,
      })
    : '내 계정'
  const loggedIn = Boolean(accessToken)
  const showUserChrome = loggedIn && (!meLoading || !!user)

  const navLinkClass =
    'text-sm text-[#555555] no-underline transition-opacity hover:opacity-90 hover:text-black'

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#eeeeee] bg-white">
      <div className="flex h-16 items-center justify-between px-6 max-md:px-4">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 no-underline">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-base font-bold text-white">
            G
          </div>
          <span className="truncate text-base font-semibold text-black max-md:max-w-[140px]">글로벌 오디션</span>
        </Link>

        <nav className="hidden gap-8 lg:flex">
          <Link href="/auditions" className={navLinkClass}>
            오디션
          </Link>
          <Link href="/channels" className={navLinkClass}>
            채널
          </Link>
          <Link href="/videos" className={navLinkClass}>
            영상
          </Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsLanguageOpen((p) => !p)}
              className="cursor-pointer border-0 bg-transparent text-sm text-[#555555]"
            >
              {locale.toUpperCase()}
            </button>
            {isLanguageOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 min-w-[80px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {locales.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeLocale(item)}
                    className="block w-full px-3 py-2 text-left text-sm uppercase hover:bg-gray-100"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!showUserChrome ? (
            <>
              <Link href="/login" className="text-sm text-black no-underline">
                {t('login')}
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center justify-center rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-4 text-sm font-medium text-white no-underline"
              >
                {t('register')}
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((p) => !p)}
                className="flex max-w-[200px] items-center gap-2 rounded-full border-0 bg-transparent p-0"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-sm font-semibold text-white">
                  {displayName.charAt(0) || '?'}
                </div>
                <span className="truncate text-sm text-gray-900">{displayName}</span>
              </button>
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  <Link href="/profile" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                    프로필
                  </Link>
                  {userRole === 'AGENCY' || userRole === 'ADMIN' ? (
                    <Link href="/my/dashboard" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                      기획사 대시보드
                    </Link>
                  ) : userRole === 'APPLICANT' ? (
                    <Link href="/my/applications" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                      내 지원
                    </Link>
                  ) : null}
                  <Link href="/channel" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                    내 채널 관리
                  </Link>
                  <Link href="/vault" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                    창작물 보관소
                  </Link>
                  <button type="button" onClick={handleLogout} className={`${DROPDOWN_ITEM} text-red-600`}>
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
          className="flex h-9 w-9 items-center justify-center rounded border border-gray-200 lg:hidden"
          aria-label="메뉴"
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

      {isMobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-md lg:hidden">
          <div className="flex flex-col gap-1">
            <Link href="/auditions" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm text-gray-900">
              오디션
            </Link>
            <Link href="/channels" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm text-gray-900">
              채널
            </Link>
            <Link href="/videos" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm text-gray-900">
              영상
            </Link>
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="mb-2 text-sm text-gray-600">언어</div>
            <div className="flex flex-wrap gap-2">
              {locales.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeLocale(item)}
                  className="rounded border border-gray-200 px-2 py-1 text-sm uppercase"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
            {showUserChrome ? (
              <>
                <div className="truncate py-1 text-sm font-medium text-gray-900">{displayName}</div>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                >
                  프로필
                </Link>
                {userRole === 'AGENCY' || userRole === 'ADMIN' ? (
                  <Link
                    href="/my/dashboard"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                  >
                    기획사 대시보드
                  </Link>
                ) : userRole === 'APPLICANT' ? (
                  <Link
                    href="/my/applications"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                  >
                    내 지원
                  </Link>
                ) : null}
                <Link
                  href="/channel"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                >
                  내 채널 관리
                </Link>
                <Link
                  href="/vault"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                >
                  창작물 보관소
                </Link>
                <button
                  type="button"
                  onClick={() => handleLogout()}
                  className="w-full rounded-lg border border-red-100 py-3 text-center text-sm text-red-600"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileOpen(false)}
                  className={`${BTN_PRIMARY} w-full justify-center py-3`}
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
