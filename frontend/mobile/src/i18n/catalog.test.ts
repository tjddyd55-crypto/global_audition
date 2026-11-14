import ko from '../../../web/messages/ko.json'
import en from '../../../web/messages/en.json'
import mn from '../../../web/messages/mn.json'
import km from '../../../web/messages/km.json'
import uz from '../../../web/messages/uz.json'
import locales from '../../../web/messages/locales.json'
import { DEFAULT_LOCALE, PRIMARY_LOCALES, detectDeviceLocale, normalizeLocale, resolveInitialLocale } from './runtime'

type Tree = Record<string, unknown>

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return keys(value as Tree, path)
    }
    return [path]
  }).sort()
}

describe('native i18n catalogs', () => {
  it('shares the same ko/en/mn/km/uz keys as web', () => {
    expect(keys(en as Tree)).toEqual(keys(ko as Tree))
    expect(keys(mn as Tree)).toEqual(keys(ko as Tree))
    expect(keys(km as Tree)).toEqual(keys(ko as Tree))
    expect(keys(uz as Tree)).toEqual(keys(ko as Tree))
  })

  it('includes native shell copy on the shared catalog', () => {
    expect((ko as { native: { otaTitle: string } }).native.otaTitle.length).toBeGreaterThan(0)
    expect((en as { native: { offlineRetry: string } }).native.offlineRetry.length).toBeGreaterThan(0)
    expect((mn as { native: { otaNow: string } }).native.otaNow.length).toBeGreaterThan(0)
  })

  it('uses the same active locale list as web', () => {
    expect([...PRIMARY_LOCALES]).toEqual(locales.primary)
    expect(locales.defaultLocale).toBe('en')
    expect(locales.publicSelector).toEqual(['ko', 'en', 'mn', 'km', 'uz'])
    expect(locales.agencyUiLocale).toBe('ko')
    expect(locales.activeTranslationTargets).toEqual(['en', 'ko', 'mn', 'km', 'uz'])
    expect(locales.contentLocales).toEqual(locales.providerLocales)
  })

  it('falls back to en for unknown or non-primary device locales', () => {
    expect(detectDeviceLocale('mn-MN')).toBe('mn')
    expect(detectDeviceLocale('ko-KR')).toBe('ko')
    expect(detectDeviceLocale('fr-FR')).toBe('en')
    expect(detectDeviceLocale('km-KH')).toBe('km')
    expect(detectDeviceLocale('uz-Latn-UZ')).toBe('uz')
    expect(detectDeviceLocale('uz_UZ')).toBe('uz')
    expect(normalizeLocale('xx-YY')).toBe('en')
    expect(DEFAULT_LOCALE).toBe('en')
  })

  it('uses a saved locale, otherwise English, and ignores the device language', () => {
    expect(resolveInitialLocale(null)).toBe('en')
    expect(resolveInitialLocale(undefined)).toBe('en')
    expect(resolveInitialLocale('ko')).toBe('ko')
    expect(resolveInitialLocale('mn')).toBe('mn')
    expect(resolveInitialLocale('km')).toBe('km')
    expect(resolveInitialLocale('uz')).toBe('uz')
    // 국가 코드가 저장값으로 들어와도 언어로 오인하지 않는다.
    expect(resolveInitialLocale('KH')).toBe('en')
    expect(resolveInitialLocale('UZ')).toBe('en')
    expect(resolveInitialLocale('ja')).toBe('en')
  })
})
