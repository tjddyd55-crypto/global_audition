import { audienceCountryFromLocale } from '../audience'
import { normalizeAudienceCountry, openAuditionListParams } from '../audienceSelection'

describe('open audition audience', () => {
  it('defaults to every public OPEN audition regardless of UI language', () => {
    expect(openAuditionListParams('ko').country).toBe('ALL')
    expect(openAuditionListParams('mn').country).toBe('ALL')
    expect(openAuditionListParams('en').country).toBe('ALL')
    expect(openAuditionListParams('ko').country).toBe(openAuditionListParams('en').country)
  })

  it('keeps an explicit country when the language would have implied another region', () => {
    expect(openAuditionListParams('en', 'KR')).toEqual({ status: 'OPEN', locale: 'en', country: 'KR' })
    expect(openAuditionListParams('ko', 'MN').country).toBe('MN')
    expect(audienceCountryFromLocale('ko')).toBe('KR')
    expect(openAuditionListParams('ko').country).not.toBe(audienceCountryFromLocale('ko'))
  })

  it('treats GLOBAL as the unfiltered scope because the API already does', () => {
    expect(normalizeAudienceCountry('GLOBAL')).toBe('ALL')
    expect(normalizeAudienceCountry('')).toBe('ALL')
    expect(normalizeAudienceCountry('jp')).toBe('JP')
    expect(normalizeAudienceCountry('nope')).toBe('ALL')
  })
})
