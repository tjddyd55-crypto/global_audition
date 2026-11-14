import { AUDIENCE_FILTER_OPTIONS, normalizeAudienceCountry, openAuditionListParams } from './audience'

describe('native audience scope', () => {
  it('does not derive the default country from the UI language', () => {
    expect(openAuditionListParams('ko').country).toBe('ALL')
    expect(openAuditionListParams('mn').country).toBe('ALL')
    // 크메르어/우즈베크어 화면도 국가 필터를 언어로 정하지 않는다(km≠KH, uz≠UZ).
    expect(openAuditionListParams('km').country).toBe('ALL')
    expect(openAuditionListParams('uz').country).toBe('ALL')
    expect(normalizeAudienceCountry('KR')).toBe('KR')
    expect(normalizeAudienceCountry('GLOBAL')).toBe('ALL')
  })
})

describe('KH/UZ country filter', () => {
  it('offers Cambodia and Uzbekistan as filter chips independent of language', () => {
    expect(AUDIENCE_FILTER_OPTIONS).toEqual(['ALL', 'KR', 'MN', 'JP', 'KH', 'UZ', 'OTHER'])
    expect(normalizeAudienceCountry('kh')).toBe('KH')
    expect(normalizeAudienceCountry('UZ')).toBe('UZ')
  })
})
