import localesMeta from '../../../messages/locales.json'

const OFFICIAL_UI_LOCALES = ['ko', 'en', 'mn', 'km', 'uz', 'zh-CN', 'zh-TW', 'ja'] as const

function readUiLocales(primary: readonly string[]): typeof OFFICIAL_UI_LOCALES {
  const matches =
    primary.length === OFFICIAL_UI_LOCALES.length &&
    primary.every((locale, index) => locale === OFFICIAL_UI_LOCALES[index])
  if (!matches) {
    throw new Error('messages/locales.json primary does not match the compiled locale list')
  }
  return OFFICIAL_UI_LOCALES
}

/** 공식 UI 로케일. 카탈로그 primary(ko/en/mn/km/uz)가 SSOT다. km=크메르어, uz=우즈베크어(라틴). */
export const UI_LOCALES = readUiLocales(localesMeta.primary)
export type UiLocale = (typeof UI_LOCALES)[number]

function readSelector(values: readonly string[] | undefined, fallback: UiLocale): readonly UiLocale[] {
  const selected = (values ?? []).filter(isUiLocale)
  return selected.length > 0 ? selected : [fallback]
}

/** 공개 서비스에서 고를 수 있는 UI 언어. */
export const PUBLIC_SELECTOR = readSelector(localesMeta.publicSelector, 'en')

export const AGENCY_UI_LOCALE: UiLocale = isUiLocale(localesMeta.agencyUiLocale)
  ? localesMeta.agencyUiLocale
  : 'ko'

const AGENCY_CONSOLE_PREFIXES = [
  '/dashboard',
  '/my/dashboard',
  '/my/auditions',
  '/my/applicants',
  '/my/stats',
  '/auditions/create',
]

/** 기획사 운영 화면. 공개 오디션 상세·지원은 포함하지 않는다. */
export function isAgencyConsolePath(pathname: string | null | undefined): boolean {
  const path = pathname && pathname.length > 0 ? pathname : '/'
  return AGENCY_CONSOLE_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

/** supported에는 있으나 공식 UI가 아닌 로케일. 옛 URL 호환용으로만 인식한다. */
export const RETIRED_UI_LOCALES = localesMeta.supported.filter(
  (locale) => !(localesMeta.primary as readonly string[]).includes(locale),
)

export function isUiLocale(value: string): value is UiLocale {
  return (UI_LOCALES as readonly string[]).includes(value)
}

export function normalizeUiLocale(raw?: string | null): UiLocale | undefined {
  const tag = (raw ?? '').trim().replace(/_/g, '-').toLowerCase()
  if (/^zh-hant(?:-|$)/.test(tag) || /^zh-(tw|hk|mo)(?:-|$)/.test(tag)) return 'zh-TW'
  if (tag === 'zh' || tag.startsWith('zh-')) return 'zh-CN'
  const language = tag.split('-')[0]
  return isUiLocale(language) ? language : undefined
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
  const locale = normalizeUiLocale(nextLocale) ?? fallbackUiLocale()
  return { href: unprefixedPathname(pathname), locale }
}

/**
 * next-intl 기본 쿠키 이름.
 * localeDetection을 끄면 미들웨어는 이 쿠키를 읽지 않으므로, 접두 없는 경로만 여기서 복원한다.
 */
export const SAVED_LOCALE_COOKIE = 'NEXT_LOCALE'

/**
 * 접두 없는 경로이고 쿠키가 공식 UI 로케일이면 그 접두를 붙인다.
 * 이미 URL에 로케일이 있으면 null — 명시적 URL이 저장값보다 우선이다.
 * 폐기 로케일 경로는 null. 호출부가 먼저 지원 로케일로 보낸다.
 */
export function redirectPathForSavedLocale(
  pathname: string,
  cookieValue: string | null | undefined,
): string | null {
  const head = pathname.split('/')[1] ?? ''
  if (isUiLocale(head) || RETIRED_UI_LOCALES.includes(head.toLowerCase())) return null
  const saved = normalizeUiLocale(cookieValue)
  if (!saved) return null
  const suffix = pathname === '/' ? '' : pathname
  return `/${saved}${suffix}`
}

/** 폐기 로케일 URL을 지원 로케일로 보낸다. 쿼리는 호출부가 유지한다. */
export function redirectPathForRetiredLocale(pathname: string): string | null {
  const segments = pathname.split('/')
  const head = (segments[1] ?? '').toLowerCase()
  const chinese = head.startsWith('zh-') || head === 'zh' ? normalizeUiLocale(head) : undefined
  if (chinese && segments[1] === chinese) return null
  if (!chinese && !RETIRED_UI_LOCALES.includes(head)) return null
  const rest = segments.slice(2).filter((segment) => segment.length > 0).join('/')
  const base = `/${chinese ?? fallbackUiLocale()}`
  return rest ? `${base}/${rest}` : base
}

function unprefixedPathname(pathname: string | null | undefined): string {
  const raw = pathname && pathname.length > 0 ? pathname : '/'
  const href = raw.startsWith('/') ? raw : `/${raw}`
  const head = href.split('/')[1] ?? ''
  const prefixed = isUiLocale(head) || RETIRED_UI_LOCALES.includes(head.toLowerCase())
  if (!prefixed) return href
  const rest = href.split('/').slice(2).filter((segment) => segment.length > 0).join('/')
  return rest ? `/${rest}` : '/'
}

/** 언어 선택 메뉴에 보이는 자국어 이름. 번역 카탈로그와 무관하게 항상 해당 언어로 표시한다. */
export const UI_LOCALE_NATIVE_NAMES: Record<UiLocale, string> = {
  ko: '한국어',
  en: 'English',
  mn: 'Монгол',
  km: 'ខ្មែរ',
  uz: 'Oʻzbekcha',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  ja: '日本語',
}

/** Intl/number/date 포맷용 BCP-47 태그. */
export const UI_LOCALE_INTL_TAGS: Record<UiLocale, string> = {
  ko: 'ko-KR',
  en: 'en-US',
  mn: 'mn-MN',
  km: 'km-KH',
  uz: 'uz-Latn-UZ',
  'zh-CN': 'zh-CN',
  'zh-TW': 'zh-TW',
  ja: 'ja-JP',
}

/** 화면 로케일 → Intl 태그. 알 수 없으면 en-US. */
export function intlTagForUiLocale(locale: string | null | undefined): string {
  const language = normalizeUiLocale(locale)
  return language ? UI_LOCALE_INTL_TAGS[language] : 'en-US'
}
