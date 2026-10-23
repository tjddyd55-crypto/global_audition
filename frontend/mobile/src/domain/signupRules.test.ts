import i18n from '../i18n'
import { DEFAULT_LOCALE } from '../i18n/runtime'
import { validateSignupDraft } from './signupRules'

describe('validateSignupDraft', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('ko')
  })

  afterAll(async () => {
    await i18n.changeLanguage(DEFAULT_LOCALE)
  })

  const valid = {
    email: 'user@example.com',
    password: 'secret1',
    nickname: '지원자닉',
    role: 'APPLICANT' as const,
  }

  it('uses the English catalog when no locale is saved', async () => {
    await i18n.changeLanguage(DEFAULT_LOCALE)
    expect(validateSignupDraft({ ...valid, password: '123' })).toMatch(/at least 6/)
  })

  it('accepts backend-valid DTO fields', () => {
    expect(validateSignupDraft(valid)).toBeNull()
  })

  it('rejects short password and reserved nickname', () => {
    expect(validateSignupDraft({ ...valid, password: '123' })).toMatch(/6자/)
    expect(validateSignupDraft({ ...valid, nickname: 'admin' })).toMatch(/사용할 수 없는/)
  })

  it('rejects invalid email and nickname charset', () => {
    expect(validateSignupDraft({ ...valid, email: 'not-email' })).toMatch(/이메일/)
    expect(validateSignupDraft({ ...valid, nickname: 'bad name' })).toMatch(/한글/)
  })
})
