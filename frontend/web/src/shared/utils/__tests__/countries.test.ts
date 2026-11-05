import { COUNTRY_CODES, countries, timezones } from '../countries'

describe('applicant signup countries', () => {
  it('includes Mongolia and Asia/Ulaanbaatar', () => {
    expect(COUNTRY_CODES).toContain('MN')
    expect(countries.map((country) => country.code)).toContain('MN')
    expect(timezones.map((zone) => zone.value)).toContain('Asia/Ulaanbaatar')
  })

  it('keeps the country list independent of the UI language', () => {
    expect(typeof COUNTRY_CODES).toBe('object')
    expect(COUNTRY_CODES).toEqual(countries.map((country) => country.code))
    expect(new Set(COUNTRY_CODES).size).toBe(COUNTRY_CODES.length)
  })
})
