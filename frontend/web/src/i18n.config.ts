import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'
import { UI_LOCALES } from './shared/i18n/uiLocales'

export const routing = defineRouting({
  // 공식 UI는 ko/en/mn. 나머지 로케일 URL은 미들웨어가 지원 로케일로 보낸다.
  locales: [...UI_LOCALES],

  // 기본 언어
  defaultLocale: 'ko',

  // URL에 언어 코드 포함 여부
  localePrefix: 'always',
})

// 타입 안전한 네비게이션
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
