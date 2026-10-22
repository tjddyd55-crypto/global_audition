import { defineRouting } from 'next-intl/routing'
import { createNavigation } from 'next-intl/navigation'
import { UI_LOCALES } from './shared/i18n/uiLocales'

export const routing = defineRouting({
  // 공식 UI는 ko/en/mn. 나머지 로케일 URL은 미들웨어가 지원 로케일로 보낸다.
  locales: [...UI_LOCALES],

  // 첫 방문 기본값. 브라우저 언어(Accept-Language)는 선택을 덮지 않는다.
  defaultLocale: 'en',

  // URL에 언어 코드 포함 여부
  localePrefix: 'always',

  // false면 next-intl이 쿠키와 Accept-Language를 둘 다 무시한다.
  // 저장된 NEXT_LOCALE은 middleware가 접두 없는 경로에서만 적용한다.
  localeDetection: false,
})

// 타입 안전한 네비게이션
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
