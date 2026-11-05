import { buildApplicantSignupPayload } from '../buildApplicantSignupPayload'

describe('buildApplicantSignupPayload', () => {
  it('sends country and timezone without tying them to the UI language', () => {
    const payload = buildApplicantSignupPayload({
      email: '  user@example.com ',
      password: 'secret1',
      nickname: ' mn_user ',
      countryCode: 'mn',
      timezone: ' Asia/Ulaanbaatar ',
    })
    expect(payload).toEqual({
      email: 'user@example.com',
      password: 'secret1',
      role: 'APPLICANT',
      nickname: 'mn_user',
      name: undefined,
      countryCode: 'MN',
      timezone: 'Asia/Ulaanbaatar',
    })
    expect(payload).not.toHaveProperty('locale')
  })

  it.each([
    ['KR', 'Asia/Seoul'],
    ['JP', 'Asia/Tokyo'],
  ])('keeps %s and %s', (countryCode, timezone) => {
    const payload = buildApplicantSignupPayload({
      email: 'a@b.co',
      password: 'secret1',
      nickname: 'name',
      countryCode,
      timezone,
    })
    expect(payload.countryCode).toBe(countryCode)
    expect(payload.timezone).toBe(timezone)
    expect(payload.role).toBe('APPLICANT')
  })
})
