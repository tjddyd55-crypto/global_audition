import ko from '../../../../messages/ko.json'
import en from '../../../../messages/en.json'
import mn from '../../../../messages/mn.json'
import { displayAuditionTag, tagFilterToken } from '../auditionTagLabels'

const catalogs = { ko, en, mn } as const

function translate(locale: keyof typeof catalogs, key: string): string {
  const table = catalogs[locale].auditionTag as Record<string, string>
  const value = table[key]
  if (!value) throw new Error(`missing ${locale} auditionTag.${key}`)
  return value
}

describe('audition tag labels', () => {
  it('translates predefined tags in ko, en, and mn without changing the stored value', () => {
    const stored = '보컬'
    expect(displayAuditionTag(stored, (key) => translate('ko', key))).toBe('보컬')
    expect(displayAuditionTag(stored, (key) => translate('en', key))).toBe('Vocal')
    expect(displayAuditionTag(stored, (key) => translate('mn', key))).toBe('Дуу')
    expect(tagFilterToken({ tagId: 'tag-vocal', name: stored })).toBe('tag-vocal')
  })

  it('uses a content translation for free-text tags and falls back to the original', () => {
    expect(displayAuditionTag('Street', (key) => translate('en', key), { 'tag:Street': 'Гудамж' })).toBe('Гудамж')
    expect(displayAuditionTag('Street', (key) => translate('en', key), { 'tag:Street': 'Гудамж' }, true)).toBe('Street')
    expect(displayAuditionTag('Street', (key) => translate('en', key))).toBe('Street')
    expect(tagFilterToken({ tagId: null, name: 'Street' })).toBe('Street')
  })
})
