import { normalizeAudienceCountry, openAuditionListParams } from './audience'

describe('native audience scope', () => {
  it('does not derive the default country from the UI language', () => {
    expect(openAuditionListParams('ko').country).toBe('ALL')
    expect(openAuditionListParams('mn').country).toBe('ALL')
    expect(normalizeAudienceCountry('KR')).toBe('KR')
    expect(normalizeAudienceCountry('GLOBAL')).toBe('ALL')
  })
})
