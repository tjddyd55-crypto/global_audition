import {
  fallbackUiLocale,
  localeSwitchTarget,
  redirectPathForRetiredLocale,
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
})
