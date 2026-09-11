import ko from '../../../web/messages/ko.json'
import en from '../../../web/messages/en.json'
import mn from '../../../web/messages/mn.json'
import { DEFAULT_LOCALE, detectDeviceLocale, normalizeLocale } from './runtime'

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
  it('shares the same ko/en/mn keys as web', () => {
    expect(keys(en as Tree)).toEqual(keys(ko as Tree))
    expect(keys(mn as Tree)).toEqual(keys(ko as Tree))
  })

  it('falls back to en for unknown or non-primary device locales', () => {
    expect(detectDeviceLocale('mn-MN')).toBe('mn')
    expect(detectDeviceLocale('ko-KR')).toBe('ko')
    expect(detectDeviceLocale('fr-FR')).toBe('en')
    expect(normalizeLocale('xx-YY')).toBe('en')
    expect(DEFAULT_LOCALE).toBe('ko')
  })
})
