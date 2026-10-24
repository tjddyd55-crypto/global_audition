'use client'

import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { Link, usePathname, useRouter } from '../../i18n.config'
import { authApi } from '@/shared/api/auth'
import { userApi } from '@/shared/api/user'
import { useAuthStore } from '@/shared/auth/authStore'
import { getDisplayNickname } from '@/shared/user/getDisplayNickname'
import { BTN_PRIMARY, DROPDOWN_ITEM } from '@/shared/ui/specClasses'
import { DeviceToggle } from '@/shared/device/DeviceToggle'
import {
  AGENCY_UI_LOCALE,
  isAgencyConsolePath,
  localeSwitchTarget,
  PUBLIC_SELECTOR,
} from '@/shared/i18n/uiLocales'

export default function MainHeader() {
  const t = useTranslations('common')
  const tFallback = useTranslations('fallback')
  const tNav = useTranslations('nav')
  const tAgency = useTranslations('agency')
  const tChannel = useTranslations('channel')
  const tVault = useTranslations('vault')
  const tLanguages = useTranslations('languages')
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

  useEffect(() => {
    setIsLanguageOpen(false)
    setIsMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!isLanguageOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLanguageOpen(false)
    }
    const onPointer = (e: PointerEvent) => {
      const el = e.target as Element | null
      if (!el?.closest('[data-language-menu],[data-language-toggle]')) setIsLanguageOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [isLanguageOpen])

  const locales = isAgencyConsolePath(pathname) ? [AGENCY_UI_LOCALE] : PUBLIC_SELECTOR

  const changeLocale = (nextLocale: string) => {
    const target = localeSwitchTarget(pathname, nextLocale)
    if (target.locale !== locale) {
      router.push(target.href, { locale: target.locale })
    }
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
    ? getDisplayNickname(
        {
          nickname: user.nickname,
          legalName: user.legalName,
          email: user.email,
          displayName: user.displayName,
        },
        tFallback('userName'),
      )
    : t('myAccount')
  const loggedIn = Boolean(accessToken)
  const showUserChrome = loggedIn && (!meLoading || !!user)

  const navLinkClass =
    'text-sm text-[#555555] no-underline transition-opacity hover:opacity-90 hover:text-black'

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#eeeeee] bg-white">
      <div className="flex h-16 items-center justify-between px-6 max-md:px-4">
        <div className="flex min-w-0 items-center gap-1 lg:contents">
          <button
            type="button"
            onClick={() => { setIsLanguageOpen(false); setIsMobileOpen((p) => !p) }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-0 bg-transparent lg:hidden"
            data-testid="mobile-menu-button"
            aria-label={tNav('menu')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          <Link href="/" className="flex min-w-0 items-center gap-2 no-underline lg:shrink-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-base font-bold text-white">
              G
            </div>
            <span className="truncate text-base font-semibold text-black max-lg:text-[15px]">{t('appName')}</span>
          </Link>
        </div>

        <nav className="hidden gap-8 lg:flex">
          <Link href="/auditions" className={navLinkClass}>
            {t('auditions')}
          </Link>
          <Link href="/channels" className={navLinkClass}>
            {t('channels')}
          </Link>
          <Link href="/videos" className={navLinkClass}>
            {t('videos')}
          </Link>
          <Link href="/agencies" className={navLinkClass}>
            {t('agencies')}
          </Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => { setIsMobileOpen(false); setIsLanguageOpen((p) => !p) }}
              data-language-toggle
              className="cursor-pointer border-0 bg-transparent text-sm text-[#555555]"
              data-testid="language-current"
            >
              {locale.toUpperCase()}
            </button>
            {isLanguageOpen && (
              <div data-language-menu className="absolute right-0 top-full z-50 mt-1 min-w-[80px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {locales.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeLocale(item)}
                    aria-current={item === locale ? 'true' : undefined}
                    data-testid={`language-option-${item}`}
                    className={`block w-full px-3 py-2 text-left text-sm uppercase hover:bg-gray-100 ${item === locale ? 'font-semibold text-[#7c3aed]' : ''}`}
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
                    {t('profile')}
                  </Link>
                  {userRole === 'SUPER_ADMIN' ? (
                    <Link href="/admin/super" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                      {tNav('adminConsole')}
                    </Link>
                  ) : null}
                  {userRole === 'AGENCY' || userRole === 'ADMIN' ? (
                    <Link href="/my/dashboard" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                      {tAgency('dashboard')}
                    </Link>
                  ) : userRole === 'APPLICANT' ? (
                    <Link href="/my/applications" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                      {tNav('applications')}
                    </Link>
                  ) : null}
                  <Link href="/channel" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                    {tChannel('manageMine')}
                  </Link>
                  <Link href="/vault" className={DROPDOWN_ITEM} onClick={closeUserMenu}>
                    {tVault('title')}
                  </Link>
                  <div className="my-1 border-t border-gray-100" />
                  <DeviceToggle className={DROPDOWN_ITEM} onToggled={closeUserMenu} />
                  <button type="button" onClick={handleLogout} className={`${DROPDOWN_ITEM} text-red-600`}>
                    {t('logout')}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 lg:hidden" data-testid="mobile-header-actions">
          <div className="relative">
            <button
              type="button"
              onClick={() => { setIsMobileOpen(false); setIsLanguageOpen((p) => !p) }}
              data-language-toggle
              className="flex h-9 items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-800"
              data-testid="mobile-language-current"
              aria-label={t('language')}
            >
              <svg aria-hidden className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth={1.8} />
                <path strokeWidth={1.8} d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18" />
              </svg>
              <span className="hidden whitespace-nowrap min-[375px]:inline">{tLanguages(locale)}</span>
              <span className="whitespace-nowrap uppercase min-[375px]:hidden">{locale}</span>
            </button>
            {isLanguageOpen && (
              <div data-language-menu className="absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {locales.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => changeLocale(item)}
                    aria-current={item === locale ? 'true' : undefined}
                    data-testid={`mobile-language-option-${item}`}
                    className={`block w-full whitespace-nowrap px-3 py-2 text-left text-sm hover:bg-gray-100 ${item === locale ? 'font-semibold text-[#7c3aed]' : ''}`}
                  >
                    {item === locale ? '✓ ' : ''}{tLanguages(item)}
                  </button>
                ))}
              </div>
            )}
          </div>
          {!showUserChrome ? (
            <Link
              href="/login"
              data-testid="mobile-login-button"
              className="inline-flex h-9 items-center whitespace-nowrap rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-3 text-xs font-semibold text-white no-underline"
            >
              {t('login')}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => { setIsLanguageOpen(false); setIsMobileOpen((p) => !p) }}
              aria-label={displayName}
              data-testid="mobile-account-button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-gradient-to-r from-[#7c3aed] to-[#ec4899] text-sm font-semibold text-white"
            >
              {displayName.charAt(0) || '?'}
            </button>
          )}
        </div>
      </div>

      {isMobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 shadow-md lg:hidden">
          <div className="flex flex-col gap-1">
            <Link href="/auditions" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm text-gray-900">
              {t('auditions')}
            </Link>
            <Link href="/channels" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm text-gray-900">
              {t('channels')}
            </Link>
            <Link href="/videos" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm text-gray-900">
              {t('videos')}
            </Link>
            <Link href="/agencies" onClick={() => setIsMobileOpen(false)} className="py-2 text-sm text-gray-900">
              {t('agencies')}
            </Link>
          </div>
          <div className="mt-3 border-t border-gray-200 pt-3">
            <div className="mb-2 text-sm text-gray-600">{t('language')}</div>
            <div className="flex flex-wrap gap-2">
              {locales.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => changeLocale(item)}
                  aria-current={item === locale ? 'true' : undefined}
                  className={`rounded border px-2 py-1 text-sm uppercase ${item === locale ? 'border-[#7c3aed] text-[#7c3aed]' : 'border-gray-200'}`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-gray-200 pt-4">
            <DeviceToggle
              className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
              onToggled={() => setIsMobileOpen(false)}
            />
            {showUserChrome ? (
              <>
                <div className="truncate py-1 text-sm font-medium text-gray-900">{displayName}</div>
                <Link
                  href="/profile"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                >
                  {t('profile')}
                </Link>
                {userRole === 'SUPER_ADMIN' ? (
                  <Link
                    href="/admin/super"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm font-medium text-violet-700"
                  >
                    {tNav('adminConsole')}
                  </Link>
                ) : null}
                {userRole === 'AGENCY' || userRole === 'ADMIN' ? (
                  <Link
                    href="/my/dashboard"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                  >
                    {tAgency('dashboard')}
                  </Link>
                ) : userRole === 'APPLICANT' ? (
                  <Link
                    href="/my/applications"
                    onClick={() => setIsMobileOpen(false)}
                    className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                  >
                    {tNav('applications')}
                  </Link>
                ) : null}
                <Link
                  href="/channel"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                >
                  {tChannel('manageMine')}
                </Link>
                <Link
                  href="/vault"
                  onClick={() => setIsMobileOpen(false)}
                  className="w-full rounded-lg border border-[#E5E7EB] py-3 text-center text-sm text-gray-900"
                >
                  {tVault('title')}
                </Link>
                <button
                  type="button"
                  onClick={() => handleLogout()}
                  className="w-full rounded-lg border border-red-100 py-3 text-center text-sm text-red-600"
                >
                  {t('logout')}
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
