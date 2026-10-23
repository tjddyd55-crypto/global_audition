import { adminPageAllowed, countryAgencyDetailId, isAdminPagePath } from '../adminPageAccess'

describe('admin page access', () => {
  it('blocks unauthenticated and wrong-role document paths', () => {
    expect(isAdminPagePath('/admin/super')).toBe(true)
    expect(adminPageAllowed('/admin/super', null)).toBe(false)
    expect(adminPageAllowed('/admin/country', undefined)).toBe(false)
    expect(adminPageAllowed('/admin/super', 'COUNTRY_ADMIN')).toBe(false)
    expect(adminPageAllowed('/admin/country', 'SUPER_ADMIN')).toBe(false)
    expect(adminPageAllowed('/admin/country', 'AGENCY')).toBe(false)
    expect(adminPageAllowed('/en/login', null)).toBe(true)
  })

  it('keeps headquarters on SUPER_ADMIN and accepts the legacy alias', () => {
    expect(adminPageAllowed('/admin/super/settlements', 'SUPER_ADMIN')).toBe(true)
    expect(adminPageAllowed('/admin/super', 'GLOBAL_SUPER_ADMIN')).toBe(true)
    expect(adminPageAllowed('/admin/country', 'GLOBAL_SUPER_ADMIN')).toBe(false)
  })

  it('blocks staff over-scope pages and still allows their menus', () => {
    expect(adminPageAllowed('/admin/country', 'COUNTRY_STAFF')).toBe(true)
    expect(adminPageAllowed('/admin/country/agencies', 'COUNTRY_STAFF')).toBe(true)
    expect(adminPageAllowed('/admin/country/crm', 'COUNTRY_STAFF')).toBe(true)
    expect(adminPageAllowed('/admin/country/settlement', 'COUNTRY_STAFF')).toBe(false)
    expect(adminPageAllowed('/admin/country/contract', 'COUNTRY_STAFF')).toBe(false)
    expect(adminPageAllowed('/admin/country/approvals', 'COUNTRY_STAFF')).toBe(false)
    expect(adminPageAllowed('/admin/country/staff', 'COUNTRY_STAFF')).toBe(false)
    expect(adminPageAllowed('/admin/country/settlement', 'COUNTRY_ADMIN')).toBe(true)
  })

  it('reads only the agency detail id', () => {
    expect(countryAgencyDetailId('/admin/country/agencies')).toBeNull()
    expect(countryAgencyDetailId('/admin/country/agencies/dd0bfacd-d187-477a-8c7f-fc64330e6e2d')).toBe(
      'dd0bfacd-d187-477a-8c7f-fc64330e6e2d',
    )
  })
})
