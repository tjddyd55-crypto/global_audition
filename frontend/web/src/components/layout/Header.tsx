'use client'

import { Link } from '@/i18n.config'
import { useTranslations } from 'next-intl'
import { useState, memo, useMemo } from 'react'
import LanguageSwitcher from '@/components/common/LanguageSwitcher'

const Header = memo(function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const t = useTranslations('common')
  
  // 메뉴 토글 핸들러 메모이제이션
  const toggleMenu = useMemo(() => () => setIsMenuOpen(prev => !prev), [])
  const closeMenu = useMemo(() => () => setIsMenuOpen(false), [])

  return (
    <header className="sticky top-0 z-50 bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            {t('appName')}
          </Link>

          {/* Desktop Menu */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/auditions" className="hover:text-primary-600">
              {t('auditions')}
            </Link>
            <Link href="/channel" className="hover:text-primary-600">
              채널
            </Link>
            <Link href="/register" className="hover:text-primary-600">
              {t('register')}
            </Link>
            <Link href="/login" className="hover:text-primary-600">
              {t('login')}
            </Link>
            <LanguageSwitcher />
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={toggleMenu}
            aria-label="메뉴"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <nav className="md:hidden py-4 space-y-2">
            <Link
              href="/auditions"
              className="block py-2 hover:text-primary-600"
              onClick={closeMenu}
            >
              {t('auditions')}
            </Link>
            <Link
              href="/channel"
              className="block py-2 hover:text-primary-600"
              onClick={closeMenu}
            >
              채널
            </Link>
            <Link
              href="/register"
              className="block py-2 hover:text-primary-600"
              onClick={closeMenu}
            >
              {t('register')}
            </Link>
            <Link
              href="/login"
              className="block py-2 hover:text-primary-600"
              onClick={closeMenu}
            >
              {t('login')}
            </Link>
            <div className="pt-2">
              <LanguageSwitcher />
            </div>
          </nav>
        )}
      </div>
    </header>
  )
})

export default Header
