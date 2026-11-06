import ko from '../../../../web/messages/ko.json'
import en from '../../../../web/messages/en.json'
import mn from '../../../../web/messages/mn.json'
import { NATIVE_TAB_ITEMS, isSingleLineLabel, tabChrome, type NativeTabRoute } from './nativeTabItems'

const ROUTES = Object.keys(NATIVE_TAB_ITEMS) as NativeTabRoute[]

type NavCatalog = {
  nav: Record<'home' | 'auditions' | 'vote' | 'applications' | 'profile', string>
}

const CATALOGS: ['ko' | 'en' | 'mn', NavCatalog][] = [
  ['ko', ko as NavCatalog],
  ['en', en as NavCatalog],
  ['mn', mn as NavCatalog],
]

describe('native bottom tabs', () => {
  it('gives each route one label key and one icon', () => {
    expect(ROUTES).toEqual(['index', 'auditions', 'vote', 'applications', 'profile'])
    const labelKeys = ROUTES.map((route) => tabChrome(route).labelKey)
    const icons = ROUTES.map((route) => tabChrome(route).icon)
    expect(new Set(labelKeys).size).toBe(ROUTES.length)
    expect(new Set(icons).size).toBe(ROUTES.length)
    for (const route of ROUTES) {
      const chrome = tabChrome(route)
      expect(chrome.labelSlots).toBe(1)
      expect(chrome.numberOfLines).toBe(1)
      expect(chrome.adjustsFontSizeToFit).toBe(true)
      expect(chrome.fontSize).toBe(11)
      expect(chrome.minimumFontScale).toBeLessThan(1)
      expect(chrome.icon).not.toBe(chrome.labelKey)
    }
  })

  it('keeps ko/en/mn tab names on a single line', () => {
    for (const [locale, messages] of CATALOGS) {
      const labels = ROUTES.map((route) => {
        const key = NATIVE_TAB_ITEMS[route].labelKey.replace('nav.', '') as keyof NavCatalog['nav']
        return messages.nav[key]
      })
      expect(new Set(labels).size).toBe(labels.length)
      for (const label of labels) {
        expect({ locale, label, singleLine: isSingleLineLabel(label) }).toEqual({
          locale,
          label,
          singleLine: true,
        })
      }
    }
  })
})
