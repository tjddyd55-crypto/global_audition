import localesMeta from '../../../messages/locales.json'

/** 공식 UI 로케일. 카탈로그 primary(ko/en/mn)가 SSOT다. */
export const UI_LOCALES = localesMeta.primary as readonly ['ko', 'en', 'mn']
export type UiLocale = (typeof UI_LOCALES)[number]

/** supported에는 있으나 공식 UI가 아닌 로케일. 옛 URL 호환용으로만 인식한다. */
export const RETIRED_UI_LOCALES = localesMeta.supported.filter(
  (locale) => !(localesMeta.primary as readonly string[]).includes(locale),
)

export function isUiLocale(value: string): value is UiLocale {
  return (UI_LOCALES as readonly string[]).includes(value)
}

export function fallbackUiLocale(): UiLocale {
  return isUiLocale(localesMeta.deviceFallback) ? localesMeta.deviceFallback : 'en'
}

/**
 * next-intl `usePathname()`은 로케일 접두가 없다.
 * `router.push`가 접두를 한 번 붙이므로, 여기서는 접두를 넣지 않고 locale 옵션만 넘긴다.
 * 이미 접두가 들어온 경로도 벗겨 이중 접두(/en/en/...)를 막는다.
 */
export function localeSwitchTarget(
  pathname: string | null | undefined,
  nextLocale: string,
): { href: string; locale: UiLocale } {
  const locale = isUiLocale(nextLocale) ? nextLocale : fallbackUiLocale()
  return { href: unprefixedPathname(pathname), locale }
}

/** 폐기 로케일 URL을 지원 로케일로 보낸다. 쿼리는 호출부가 유지한다. */
export function redirectPathForRetiredLocale(pathname: string): string | null {
  const segments = pathname.split('/')
  const head = (segments[1] ?? '').toLowerCase()
  if (!RETIRED_UI_LOCALES.includes(head)) return null
  const rest = segments.slice(2).filter((segment) => segment.length > 0).join('/')
  const base = `/${fallbackUiLocale()}`
  return rest ? `${base}/${rest}` : base
}

function unprefixedPathname(pathname: string | null | undefined): string {
  const raw = pathname && pathname.length > 0 ? pathname : '/'
  const href = raw.startsWith('/') ? raw : `/${raw}`
  const head = (href.split('/')[1] ?? '').toLowerCase()
  const prefixed = isUiLocale(head) || RETIRED_UI_LOCALES.includes(head)
  if (!prefixed) return href
  const rest = href.split('/').slice(2).filter((segment) => segment.length > 0).join('/')
  return rest ? `/${rest}` : '/'
}
