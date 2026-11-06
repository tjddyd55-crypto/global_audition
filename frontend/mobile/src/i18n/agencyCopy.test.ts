import i18n from './index'
import { DEFAULT_LOCALE } from './runtime'
import { AGENCY_UI_LOCALE, agencyCopy } from './agencyCopy'

describe('native agency copy', () => {
  afterAll(async () => {
    await i18n.changeLanguage(DEFAULT_LOCALE)
  })

  it('keeps agency screens in Korean while the applicant locale stays en or mn', async () => {
    expect(AGENCY_UI_LOCALE).toBe('ko')
    await i18n.changeLanguage('en')
    expect(agencyCopy('agency.applicants')).toBe('지원자 관리')
    expect(i18n.t('agency.applicants')).toBe('Applicant management')
    expect(i18n.language).toBe('en')

    await i18n.changeLanguage('mn')
    expect(agencyCopy('agency.applicants')).toBe('지원자 관리')
    expect(i18n.t('agency.applicants')).not.toBe('지원자 관리')
    expect(i18n.language).toBe('mn')
  })
})