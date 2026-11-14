import { COUNTRY_CODES } from '../../utils/countries'
import { routing } from '../../../i18n.config'
import localesMeta from '../../../../messages/locales.json'
import {
  AGENCY_UI_LOCALE,
  fallbackUiLocale,
  intlTagForUiLocale,
  isUiLocale,
  localeSwitchTarget,
  PUBLIC_SELECTOR,
  redirectPathForRetiredLocale,
  redirectPathForSavedLocale,
  RETIRED_UI_LOCALES,
  UI_LOCALE_NATIVE_NAMES,
  UI_LOCALES,
} from '../uiLocales'

/**
 * next-intl 3.26 `usePathname()`은 접두를 제거하고 `router.push`가 다시 붙인다.
 * 접두를 넣어 push하면 `/en/en/...`가 된다. 이 테스트는 그 입력을 재현한다.
 */
function legacyPrefixedPath(pathname: string, nextLocale: string): string {
  const segments = pathname.split('/')
  const known = ['ko', 'en', 'mn', 'ja', 'zh', 'es', 'fr', 'de']
  if (segments[1] && known.includes(segments[1])) segments[1] = nextLocale
  else segments.splice(1, 0, nextLocale)
  return segments.join('/') || '/'
}

describe('official UI locales', () => {
  it('exposes ko/en/mn/km/uz and retires the partial catalogs', () => {
    expect([...UI_LOCALES]).toEqual(['ko', 'en', 'mn', 'km', 'uz'])
    expect(RETIRED_UI_LOCALES).toEqual(['ja', 'zh', 'es', 'fr', 'de'])
    expect(fallbackUiLocale()).toBe('en')
  })

  it('redirects retired locale URLs onto the fallback without dropping the rest of the path', () => {
    expect(redirectPathForRetiredLocale('/ja')).toBe('/en')
    expect(redirectPathForRetiredLocale('/ja/auditions/42')).toBe('/en/auditions/42')
    expect(redirectPathForRetiredLocale('/FR/videos')).toBe('/en/videos')
    expect(redirectPathForRetiredLocale('/ko/auditions')).toBeNull()
    expect(redirectPathForRetiredLocale('/auditions')).toBeNull()
  })

  it('does not prepend a locale onto the unprefixed pathname next-intl already returns', () => {
    expect(localeSwitchTarget('/auditions/42', 'en')).toEqual({ href: '/auditions/42', locale: 'en' })
    expect(localeSwitchTarget('/', 'mn')).toEqual({ href: '/', locale: 'mn' })
    expect(localeSwitchTarget('/auditions/42', 'ko')).toEqual({ href: '/auditions/42', locale: 'ko' })

    const legacy = legacyPrefixedPath('/auditions/42', 'en')
    expect(legacy).toBe('/en/auditions/42')
    expect(localeSwitchTarget('/auditions/42', 'en').href).not.toBe(legacy)
  })

  it('strips an existing prefix so a second router.push cannot duplicate it', () => {
    expect(localeSwitchTarget('/ko/auditions/42', 'en')).toEqual({ href: '/auditions/42', locale: 'en' })
    expect(localeSwitchTarget('/ja/auditions', 'mn')).toEqual({ href: '/auditions', locale: 'mn' })
  })

  it('refuses a retired locale and falls back to en', () => {
    expect(localeSwitchTarget('/auditions', 'ja').locale).toBe('en')
  })

  it('offers five public languages while admin screens stay Korean', () => {
    expect([...UI_LOCALES]).toEqual(['ko', 'en', 'mn', 'km', 'uz'])
    expect([...PUBLIC_SELECTOR]).toEqual(['ko', 'en', 'mn', 'km', 'uz'])
    expect(AGENCY_UI_LOCALE).toBe('ko')
    expect(localesMeta.superAdminUiLocale).toBe('ko')
    expect(localesMeta.activeTranslationTargets).toEqual(['en', 'ko', 'mn', 'km', 'uz'])
  })

  it('names every public language in its own script', () => {
    expect(PUBLIC_SELECTOR.map((code) => UI_LOCALE_NATIVE_NAMES[code])).toEqual([
      '한국어',
      'English',
      'Монгол',
      'ខ្មែរ',
      'Oʻzbekcha',
    ])
  })

  it('maps km/uz to Intl tags (uz uses Latin script) and keeps language codes apart from country codes', () => {
    expect(intlTagForUiLocale('km')).toBe('km-KH')
    expect(intlTagForUiLocale('uz')).toBe('uz-Latn-UZ')
    expect(intlTagForUiLocale('ja')).toBe('en-US')
    // 국가 코드 KH/UZ 는 언어 코드가 아니다.
    expect(isUiLocale('KH')).toBe(false)
    expect(isUiLocale('kh')).toBe(false)
    expect(isUiLocale('UZ')).toBe(false)
    expect(isUiLocale('km')).toBe(true)
    expect(isUiLocale('uz')).toBe(true)
  })

  it('switches into and out of km/uz without dropping the path', () => {
    expect(localeSwitchTarget('/auditions/42', 'km')).toEqual({ href: '/auditions/42', locale: 'km' })
    expect(localeSwitchTarget('/km/auditions/42', 'uz')).toEqual({ href: '/auditions/42', locale: 'uz' })
    expect(localeSwitchTarget('/uz/channels', 'ko')).toEqual({ href: '/channels', locale: 'ko' })
    expect(redirectPathForSavedLocale('/auditions', 'km')).toBe('/km/auditions')
    expect(redirectPathForSavedLocale('/', 'uz')).toBe('/uz')
    expect(redirectPathForRetiredLocale('/km/auditions')).toBeNull()
    expect(routing.locales).toEqual(['ko', 'en', 'mn', 'km', 'uz'])
  })

  it('agency management screens follow the selected UI locale (no forced Korean)', () => {
    const mw = require('fs').readFileSync(require('path').join(__dirname, '../../../middleware.ts'), 'utf8')
    expect(mw).not.toMatch(/AgencyConsole/)
  })

  it('defaults first visits to English and does not let Accept-Language replace a saved choice', () => {
    expect(routing.defaultLocale).toBe('en')
    expect(routing.localeDetection).toBe(false)
    expect(localesMeta.defaultLocale).toBe('en')
  })

  it('keeps explicit URL locale ahead of the saved cookie, then English', () => {
    expect(redirectPathForSavedLocale('/ko/auditions/42', 'en')).toBeNull()
    expect(redirectPathForSavedLocale('/auditions/42', 'mn')).toBe('/mn/auditions/42')
    expect(redirectPathForSavedLocale('/', 'ko')).toBe('/ko')
    expect(redirectPathForSavedLocale('/', undefined)).toBeNull()
    expect(redirectPathForSavedLocale('/auditions', 'ja')).toBeNull()
    expect(redirectPathForSavedLocale('/ja/auditions', 'mn')).toBeNull()
  })
})

describe('signup countries stay independent of UI languages', () => {
  it('does not offer KH/UZ as residence countries until the backend provisions them', () => {
    expect(COUNTRY_CODES).not.toContain('KH')
    expect(COUNTRY_CODES).not.toContain('UZ')
    expect(COUNTRY_CODES).toContain('MN')
  })
})
