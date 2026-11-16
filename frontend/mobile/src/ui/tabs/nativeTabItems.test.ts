import ko from '../../../../web/messages/ko.json'
import en from '../../../../web/messages/en.json'
import mn from '../../../../web/messages/mn.json'
import km from '../../../../web/messages/km.json'
import uz from '../../../../web/messages/uz.json'
import {
  NATIVE_TAB_ITEMS,
  isSingleLineLabel,
  tabAccessibleLabelKey,
  tabChrome,
  tabVisibleLabelKey,
  type NativeTabRoute,
} from './nativeTabItems'

const ROUTES = Object.keys(NATIVE_TAB_ITEMS) as NativeTabRoute[]

type NavCatalog = {
  common: { applications: string }
  nav: Record<'home' | 'auditions' | 'vote' | 'applications' | 'profile', string>
}

const CATALOGS: ['ko' | 'en' | 'mn' | 'km' | 'uz', NavCatalog][] = [
  ['ko', ko as NavCatalog],
  ['en', en as NavCatalog],
  ['mn', mn as NavCatalog],
  ['km', km as NavCatalog],
  ['uz', uz as NavCatalog],
]

describe('native bottom tabs', () => {
  it('gives each route one label key and one icon', () => {
    expect(ROUTES).toEqual(['index', 'auditions', 'channels', 'vote', 'profile'])
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
      expect(chrome.minimumFontScale).toBe(1)
      expect(chrome.visibleLabelKey).toBe(tabVisibleLabelKey(route))
      expect(chrome.labelKey).toBe(tabAccessibleLabelKey(route))
      expect(chrome.icon).not.toBe(chrome.labelKey)
    }
  })

  it('keeps ko/en/mn/km/uz tab names on a single line', () => {
    for (const [locale, messages] of CATALOGS) {
      const labels = ROUTES.map((route) => {
        const key = NATIVE_TAB_ITEMS[route].labelKey
        return key === 'common.channels' ? (messages as unknown as { common: { channels: string } }).common.channels : messages.nav[key.replace('nav.', '') as keyof NavCatalog['nav']]
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

  it('shows Channels instead of Applications in the bottom bar', () => {
    expect(tabVisibleLabelKey('channels')).toBe('common.channels')
    expect(ROUTES).not.toContain('applications')
    for (const [, messages] of CATALOGS) {
      expect(isSingleLineLabel((messages as unknown as { common: { channels: string } }).common.channels)).toBe(true)
    }
  })
})
