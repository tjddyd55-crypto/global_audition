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

  it('fails when any primary locale is missing a key', () => {
    const koKeys = new Set(collectMessageKeys(ko))
    const enKeys = new Set(collectMessageKeys(en))
    const mnKeys = new Set(collectMessageKeys(mn))
    const missingInEn = [...koKeys].filter((key) => !enKeys.has(key))
    const missingInMn = [...koKeys].filter((key) => !mnKeys.has(key))
    expect(missingInEn).toEqual([])
    expect(missingInMn).toEqual([])
  })

  it('maps payment and credit error codes in all primary catalogs', () => {
    for (const tree of [ko, en, mn] as const) {
      const errors = (tree as { errors: Record<string, string> }).errors
      expect(errors.INSUFFICIENT_CREDITS.trim().length).toBeGreaterThan(0)
      expect(errors.CONFIG_INCOMPLETE.trim().length).toBeGreaterThan(0)
      expect(errors.TOSS_INACTIVE.trim().length).toBeGreaterThan(0)
      expect(errors.AMOUNT_MISMATCH.trim().length).toBeGreaterThan(0)
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
