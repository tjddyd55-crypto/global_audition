import {
  birthDateProblem,
  guardianLink,
  guardianStatusOf,
  parsePrivacySettings,
  privacyErrorCode,
  signupConsentBody,
  signupConsentMissing,
  toggleBlockReason,
} from '../model'

describe('privacy model', () => {
  it('parses server settings and blocks only guardian-gated toggles', () => {
    const s = parsePrivacySettings({
      channelPublic: true,
      talentSearchVisible: false,
      showGender: true,
      minor: { minor: true, guardianLegallyRequired: true, searchAllowed: false, offersAllowed: false, offersBlockReason: 'CASTING_GUARDIAN_REQUIRED', policyCountry: 'KR', adultAge: 19, guardianConsentUnderAge: 14 },
      guardian: { status: 'PENDING' },
    })
    expect(s.channelPublic).toBe(true)
    expect(s.showGender).toBe(true)
    expect(s.minor.adultAge).toBe(19)
    expect(toggleBlockReason(s, 'talentSearchVisible')).toBe('SEARCH_GUARDIAN_REQUIRED')
    expect(toggleBlockReason(s, 'castingOffersEnabled')).toBe('CASTING_GUARDIAN_REQUIRED')
    expect(toggleBlockReason(s, 'channelPublic')).toBeNull()
    expect(guardianStatusOf(s)).toBe('PENDING')
    expect(guardianStatusOf(parsePrivacySettings({}))).toBe('NONE')
  })

  it('signup consents are separated and the minor never gives guardian consent', () => {
    const c = { terms: true, privacyCollection: true, privacyDisclosure: false, marketing: false }
    expect(signupConsentMissing(c, true)).toBe(true)
    expect(signupConsentMissing(c, false)).toBe(false)
    expect(Object.keys(signupConsentBody(c))).not.toContain('agreeGuardian')
  })

  it('validates birth date shape only', () => {
    const today = new Date(Date.UTC(2026, 10, 19))
    expect(birthDateProblem('', today)).toBe('required')
    expect(birthDateProblem('2010/01/01', today)).toBe('invalid')
    expect(birthDateProblem('2010-02-30', today)).toBe('invalid')
    expect(birthDateProblem('2027-01-01', today)).toBe('invalid')
    expect(birthDateProblem('2014-05-05', today)).toBeNull()
  })

  it('builds guardian link and maps error codes', () => {
    expect(guardianLink('https://x.test/', 'mn', 'ab_c')).toBe('https://x.test/mn/guardian/ab_c')
    expect(privacyErrorCode({ message: 'SEARCH_GUARDIAN_REQUIRED' })).toBe('SEARCH_GUARDIAN_REQUIRED')
    expect(privacyErrorCode({ message: 'other' })).toBeNull()
  })
})
