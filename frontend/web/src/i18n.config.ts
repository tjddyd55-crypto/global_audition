import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'

export const routing = defineRouting({
  // 지원하는 모든 언어
  locales: ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'],

  // 기본 언어
  defaultLocale: 'ko',

  // URL에 언어 코드 포함 여부
  localePrefix: 'always',
})

// 타입 안전한 네비게이션
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
