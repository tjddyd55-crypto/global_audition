import { deepMergeMessages } from '../../../web/src/shared/i18n/mergeMessages'
import { nativeTranslationResources } from './catalogs'
import { normalizeLocale } from './runtime'

describe('native translation resources', () => {
  it('fills a missing primary key from English instead of leaving a raw key', () => {
    const english = { apply: { prevRoundBlocked: 'Only passers', failed: 'Failed' } }
    const partial = { apply: { failed: 'Амжилтгүй' } }
    const resources = nativeTranslationResources(english, english, partial)
    const merged = resources.mn.translation as { apply: { prevRoundBlocked: string } }
    expect(merged.apply.prevRoundBlocked).toBe('Only passers')
    expect(resources).not.toHaveProperty('ja')
  })

  it('deep-merges without dropping sibling English keys', () => {
    const merged = deepMergeMessages(
      { home: { heroTitle: 'Hero', kicker: 'Now' } },
      { home: { heroTitle: '히어로' } },
    ) as { home: { heroTitle: string; kicker: string } }
    expect(merged.home.heroTitle).toBe('히어로')
    expect(merged.home.kicker).toBe('Now')
  })

  it('does not keep a retired UI locale as the native language', () => {
    expect(normalizeLocale('ja')).toBe('en')
    expect(normalizeLocale('ja-JP')).toBe('en')
    expect(normalizeLocale('mn-MN')).toBe('mn')
  })
})
