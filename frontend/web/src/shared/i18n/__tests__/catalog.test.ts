import { collectMessageKeys, deepMergeMessages } from '../mergeMessages'
import ko from '../../../../messages/ko.json'
import en from '../../../../messages/en.json'
import mn from '../../../../messages/mn.json'
import locales from '../../../../messages/locales.json'

describe('i18n catalogs', () => {
  it('keeps ko/en/mn key-complete against each other', () => {
    const koKeys = collectMessageKeys(ko)
    const enKeys = collectMessageKeys(en)
    const mnKeys = collectMessageKeys(mn)
    expect(enKeys).toEqual(koKeys)
    expect(mnKeys).toEqual(koKeys)
  })

  it('has no empty primary strings', () => {
    for (const [name, tree] of [
      ['ko', ko],
      ['en', en],
      ['mn', mn],
    ] as const) {
      for (const key of collectMessageKeys(tree)) {
        const value = key.split('.').reduce<unknown>((acc, part) => (acc as Record<string, unknown>)[part], tree)
        expect(typeof value).toBe('string')
        expect(String(value).trim().length).toBeGreaterThan(0)
        expect(name).toBeTruthy()
      }
    }
  })

  it('lists mn as a first-class locale', () => {
    expect(locales.primary).toEqual(['ko', 'en', 'mn'])
    expect(locales.supported).toContain('mn')
    expect(locales.settlementCurrency).toBe('USD')
  })

  it('merges english fallback for incomplete locales', () => {
    const merged = deepMergeMessages(en as Record<string, unknown>, { common: { login: 'ログイン' } })
    expect((merged.common as Record<string, unknown>).login).toBe('ログイン')
    expect((merged.home as Record<string, unknown>).openAuditions).toBe((en.home as Record<string, string>).openAuditions)
  })
})
