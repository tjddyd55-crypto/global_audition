import { isAdminConsolePath, pathAfterLogin } from '../roleHome'

describe('pathAfterLogin', () => {
  it('sends headquarters and country roles to the unprefixed admin consoles', () => {
    expect(pathAfterLogin('SUPER_ADMIN')).toBe('/admin/super')
    expect(pathAfterLogin('GLOBAL_SUPER_ADMIN')).toBe('/admin/super')
    expect(pathAfterLogin('COUNTRY_ADMIN')).toBe('/admin/country')
    expect(pathAfterLogin('COUNTRY_STAFF')).toBe('/admin/country')
    expect(pathAfterLogin('AGENCY')).toBe('/my/dashboard')
    expect(pathAfterLogin('APPLICANT')).toBe('/my/applications')
    expect(pathAfterLogin('USER')).toBe('/')
    expect(isAdminConsolePath('/admin/super')).toBe(true)
    expect(isAdminConsolePath('/en/admin')).toBe(false)
  })
})
