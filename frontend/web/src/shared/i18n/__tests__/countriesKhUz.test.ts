import ko from '../../../../messages/ko.json'
import en from '../../../../messages/en.json'
import mn from '../../../../messages/mn.json'
import km from '../../../../messages/km.json'
import uz from '../../../../messages/uz.json'
import { AUDITION_TARGET_COUNTRIES, normalizeTargetCountry } from '../../audition/audience'
import { AUDIENCE_FILTER_OPTIONS, normalizeAudienceCountry, openAuditionListParams } from '../../audition/audienceSelection'
import { NATIONALITY_CODES, normalizeNationalityCode, nationalityOptionValues } from '../nationalityOptions'
import { knownNationalityCode, nationalityFlag } from '../../channel/nationalityDisplay'
import { COUNTRY_CODES } from '../../utils/countries'

const catalogs = { ko, en, mn, km, uz } as Record<string, Record<string, Record<string, string>>>

describe('Cambodia (KH) and Uzbekistan (UZ) are real countries', () => {
  it('can be picked as recruitment country, filter, nationality and residence', () => {
    expect(AUDITION_TARGET_COUNTRIES).toEqual(expect.arrayContaining(['KR', 'MN', 'JP', 'KH', 'UZ', 'GLOBAL', 'OTHER']))
    expect(AUDIENCE_FILTER_OPTIONS).toEqual(['ALL', 'KR', 'MN', 'JP', 'KH', 'UZ', 'OTHER'])
    expect(NATIONALITY_CODES).toEqual(['KR', 'MN', 'JP', 'KH', 'UZ', 'OTHER'])
    expect(nationalityOptionValues()).toContain('KH')
    expect(COUNTRY_CODES).toEqual(expect.arrayContaining(['KR', 'MN', 'JP', 'KH', 'UZ']))
  })

  it('normalizes aliases without mixing in language codes', () => {
    expect(normalizeTargetCountry('kh')).toBe('KH')
    expect(normalizeTargetCountry('Cambodia')).toBe('KH')
    expect(normalizeTargetCountry('UZB')).toBe('UZ')
    expect(normalizeAudienceCountry('uz')).toBe('UZ')
    expect(normalizeAudienceCountry('KH')).toBe('KH')
    expect(normalizeNationalityCode('kh')).toBe('KH')
    expect(normalizeNationalityCode('km')).toBe('')
    expect(knownNationalityCode('UZ')).toBe('UZ')
    expect(nationalityFlag('KH')).toBe('🇰🇭')
    // 언어를 바꿔도 국가 필터 값은 그대로다.
    expect(openAuditionListParams('km', 'UZ').country).toBe('UZ')
    expect(openAuditionListParams('uz', 'KH').country).toBe('KH')
    expect(openAuditionListParams('km', undefined).country).toBe('ALL')
  })

  it('has KH/UZ labels in every public UI language', () => {
    for (const [locale, catalog] of Object.entries(catalogs)) {
      for (const ns of ['country', 'nationality', 'countries']) {
        for (const code of ['KH', 'UZ']) {
          expect(`${locale}.${ns}.${code}=${catalog[ns]?.[code] ?? ''}`).not.toMatch(/=$/)
        }
      }
    }
    expect(km.country.KH).toBe('កម្ពុជា')
    expect(uz.country.UZ).toBe('Oʻzbekiston')
  })
})
