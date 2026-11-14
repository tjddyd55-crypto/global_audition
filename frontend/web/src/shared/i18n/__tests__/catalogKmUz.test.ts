import { collectMessageKeys } from '../mergeMessages'
import ko from '../../../../messages/ko.json'
import en from '../../../../messages/en.json'
import mn from '../../../../messages/mn.json'
import km from '../../../../messages/km.json'
import uz from '../../../../messages/uz.json'

type Tree = Record<string, unknown>

function valueAt(tree: Tree, key: string): string {
  return String(key.split('.').reduce<unknown>((acc, part) => (acc as Tree)[part], tree))
}

function placeholders(value: string): string[] {
  return (value.match(/\{[a-zA-Z_]+\}/g) ?? []).sort()
}

function tags(value: string): string[] {
  return (value.match(/<\/?\w+>/g) ?? []).sort()
}

const KHMER = /[\u1780-\u17FF]/

describe('km/uz catalogs', () => {
  const enKeys = collectMessageKeys(en as Tree)

  it('has every key that ko/en/mn have (no raw keys on screen)', () => {
    expect(collectMessageKeys(km as Tree)).toEqual(enKeys)
    expect(collectMessageKeys(uz as Tree)).toEqual(enKeys)
    expect(collectMessageKeys(ko as Tree)).toEqual(enKeys)
    expect(collectMessageKeys(mn as Tree)).toEqual(enKeys)
  })

  it('keeps ICU placeholders and rich-text tags identical to English', () => {
    const broken: string[] = []
    for (const key of enKeys) {
      const source = valueAt(en as Tree, key)
      for (const [name, tree] of [['km', km], ['uz', uz]] as const) {
        const value = valueAt(tree as Tree, key)
        if (value.trim().length === 0) broken.push(`${name}:${key}:empty`)
        if (placeholders(value).join() !== placeholders(source).join()) broken.push(`${name}:${key}:placeholder`)
        if (tags(value).join() !== tags(source).join()) broken.push(`${name}:${key}:tag`)
      }
    }
    expect(broken).toEqual([])
  })

  it('is actually translated, not an English copy', () => {
    const navKm = (km as { nav: Record<string, string> }).nav
    for (const label of Object.values(navKm)) expect(label).toMatch(KHMER)
    const kmCommon = (km as { common: Record<string, string> }).common
    expect(kmCommon.login).not.toBe((en as { common: Record<string, string> }).common.login)
    const uzCommon = (uz as { common: Record<string, string> }).common
    expect(uzCommon.login).toBe('Kirish')
    expect(uzCommon.login).not.toBe((en as { common: Record<string, string> }).common.login)
  })

  it('uses the Uzbek Latin oʻ/gʻ letter (U+02BB), not ASCII quotes or Cyrillic', () => {
    // 언어 이름 목록(Монгол, Русский 등)은 각 언어 표기라 제외한다.
    const values = collectMessageKeys(uz as Tree)
      .filter((key) => !key.startsWith('languages.') && !key.startsWith('locale.'))
      .map((key) => valueAt(uz as Tree, key))
    const text = values.join('\n')
    expect(text).toMatch(/oʻ/)
    expect(text).not.toMatch(/[oOgG]['`‘’]/)
    expect(text).not.toMatch(/[\u0400-\u04FF]/)
  })

  it('translates the error and notification copy shown to applicants', () => {
    for (const tree of [km, uz] as const) {
      const root = tree as { errors: Record<string, string>; notifications: Record<string, string> }
      expect(root.errors.INSUFFICIENT_CREDITS).not.toBe((en as { errors: Record<string, string> }).errors.INSUFFICIENT_CREDITS)
      expect(root.notifications.singleStagePassBody).not.toBe(
        (en as { notifications: Record<string, string> }).notifications.singleStagePassBody,
      )
    }
  })

  it('names Cambodia/Uzbekistan as countries separately from the km/uz languages', () => {
    for (const tree of [ko, en, mn, km, uz] as const) {
      const root = tree as { countries: Record<string, string>; languages: Record<string, string> }
      expect(root.countries.KH).toBeTruthy()
      expect(root.countries.UZ).toBeTruthy()
      expect(root.languages.km).toBe('ខ្មែរ')
      expect(root.languages.uz).toBe('Oʻzbekcha')
    }
  })
})
