import { routing } from '../../../i18n.config'
import localesMeta from '../../../../messages/locales.json'
import {
  AGENCY_UI_LOCALE,
  fallbackUiLocale,
  localeSwitchTarget,
  PUBLIC_SELECTOR,
  redirectPathForAgencyConsole,
  redirectPathForRetiredLocale,
  redirectPathForSavedLocale,
  RETIRED_UI_LOCALES,
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
  it('exposes only ko/en/mn and retires the partial catalogs', () => {
    expect([...UI_LOCALES]).toEqual(['ko', 'en', 'mn'])
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

  it('keeps ko/en/mn catalogs and narrows the public selector to English', () => {
    expect([...UI_LOCALES]).toEqual(['ko', 'en', 'mn'])
    expect([...PUBLIC_SELECTOR]).toEqual(['ko', 'en', 'mn'])
    expect(AGENCY_UI_LOCALE).toBe('ko')
    expect(localesMeta.superAdminUiLocale).toBe('ko')
    expect(localesMeta.activeTranslationTargets).toEqual(['en', 'ko'])
  })

  it('sends agency management screens to Korean and leaves public auditions alone', () => {
    expect(redirectPathForAgencyConsole('/en/dashboard/auditions/create')).toBe('/ko/dashboard/auditions/create')
    expect(redirectPathForAgencyConsole('/en/my/applicants')).toBe('/ko/my/applicants')
    expect(redirectPathForAgencyConsole('/mn/my/auditions/42/round-review')).toBe(
      '/ko/my/auditions/42/round-review',
    )
    expect(redirectPathForAgencyConsole('/ko/dashboard')).toBeNull()
    expect(redirectPathForAgencyConsole('/en/auditions/42')).toBeNull()
    expect(redirectPathForAgencyConsole('/en/login')).toBeNull()
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
