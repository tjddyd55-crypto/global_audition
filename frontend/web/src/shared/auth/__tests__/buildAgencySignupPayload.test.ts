import { buildAgencySignupPayload } from '../buildAgencySignupPayload'

describe('buildAgencySignupPayload', () => {
  it('includes company, registration, phone and other agency fields in the signup body', () => {
    const payload = buildAgencySignupPayload({
      email: ' agency@example.com ',
      password: 'Test1234!!',
      nickname: 'agencyNick',
      name: ' optional person ',
      countryCode: 'kr',
      companyName: ' GLOBAL TEST AGENCY ',
      legalName: ' Global Test Agency Co. ',
      businessRegistrationNumber: '123-45-67890',
      representativeName: 'Hong Gildong',
      contactEmail: 'contact@example.com',
      contactPhone: '010-1234-5678',
      website: 'https://example.com',
      businessCity: ' Seoul ',
      taxId: 'TAX-1',
      businessAddress: 'Somewhere',
      establishedYear: 2010,
      businessLicenseDocumentUrl: 'https://cdn.example.com/license.pdf',
    })

    expect(payload).toEqual({
      email: 'agency@example.com',
      password: 'Test1234!!',
      role: 'AGENCY',
      nickname: 'agencyNick',
      name: 'optional person',
      countryCode: 'KR',
      companyName: 'GLOBAL TEST AGENCY',
      legalName: 'Global Test Agency Co.',
      businessRegistrationNumber: '123-45-67890',
      representativeName: 'Hong Gildong',
      contactEmail: 'contact@example.com',
      contactPhone: '010-1234-5678',
      website: 'https://example.com',
      businessCity: 'Seoul',
      taxId: 'TAX-1',
      businessAddress: 'Somewhere',
      establishedYear: 2010,
      businessLicenseDocumentUrl: 'https://cdn.example.com/license.pdf',
    })
  })

  it('omits blank optional fields instead of sending empty strings', () => {
    const payload = buildAgencySignupPayload({
      email: 'a@b.com',
      password: 'secret1',
      nickname: 'nick',
      countryCode: 'JP',
      companyName: 'Co',
      legalName: 'Legal',
      businessRegistrationNumber: 'BR',
      representativeName: 'Rep',
      businessCity: 'Tokyo',
      contactPhone: '   ',
      website: '',
    })
    expect(payload.contactPhone).toBeUndefined()
    expect(payload.website).toBeUndefined()
    expect(payload.companyName).toBe('Co')
    expect(payload.businessRegistrationNumber).toBe('BR')
  })
})
