'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from '../../i18n.config'
import { useState } from 'react'

const LANGUAGE_OPTIONS = [
  { code: 'ko', flag: '🇰🇷' },
  { code: 'en', flag: '🇺🇸' },
  { code: 'mn', flag: '🇲🇳' },
  { code: 'ja', flag: '🇯🇵' },
  { code: 'zh', flag: '🇨🇳' },
  { code: 'es', flag: '🇪🇸' },
  { code: 'fr', flag: '🇫🇷' },
  { code: 'de', flag: '🇩🇪' },
] as const

export default function LanguageSwitcher() {
  const locale = useLocale()
  const tLang = useTranslations('languages')
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const changeLanguage = (newLocale: string) => {
    // 현재 경로에서 언어 코드를 새 언어로 교체
    const segments = pathname.split('/')
    if (segments[1] && LANGUAGE_OPTIONS.some((lang) => lang.code === segments[1])) {
      segments[1] = newLocale
    } else {
      segments.splice(1, 0, newLocale)
    }
    const newPath = segments.join('/')
    router.push(newPath)
    setIsOpen(false)
  }

  const currentLanguage = LANGUAGE_OPTIONS.find((lang) => lang.code === locale) || LANGUAGE_OPTIONS[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Change language"
      >
        <span className="text-xl">{currentLanguage.flag}</span>
        <span className="hidden sm:inline text-sm font-medium">{tLang(currentLanguage.code)}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-20">
            <div className="py-1">
              {LANGUAGE_OPTIONS.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full text-left px-4 py-2 flex items-center space-x-2 hover:bg-gray-100 transition-colors ${
                    locale === lang.code ? 'bg-primary-50 text-primary-600' : ''
                  }`}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-sm">{tLang(lang.code)}</span>
                  {locale === lang.code && (
                    <span className="ml-auto text-primary-600">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
