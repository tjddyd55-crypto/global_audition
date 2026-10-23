import { audienceCountryFromLocale } from '../audience'

describe('audienceCountryFromLocale', () => {
  it('maps primary locales to discovery country', () => {
    expect(audienceCountryFromLocale('mn')).toBe('MN')
    expect(audienceCountryFromLocale('ko-KR')).toBe('KR')
    expect(audienceCountryFromLocale('en')).toBe('GLOBAL')
    expect(audienceCountryFromLocale('ja')).toBe('JP')
  })

  it('keeps Mongolia discovery on MN so the backend can add GLOBAL', () => {
    expect(audienceCountryFromLocale('mn-MN')).toBe('MN')
  })
})
