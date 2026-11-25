import i18n from '../i18n'
import { DEFAULT_LOCALE } from '../i18n/runtime'
import { signupPasswordConfirmationError, validateSignupDraft } from './signupRules'

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

  it.each(['ko', 'en', 'mn', 'km', 'uz'])('translates password mismatch in %s', async (lang) => {
    await i18n.changeLanguage(lang)
    expect(signupPasswordConfirmationError('secret1', 'secret2')).toBe(i18n.t('auth.passwordMismatch'))
  })

  it('requires matching password confirmation without trimming passwords', () => {
    expect(signupPasswordConfirmationError('secret1', '')).not.toBeNull()
    expect(signupPasswordConfirmationError('secret1', 'secret2')).toBe(i18n.t('auth.passwordMismatch'))
    expect(signupPasswordConfirmationError('secret1', 'secret1 ')).not.toBeNull()
    expect(signupPasswordConfirmationError('secret1', 'secret1')).toBeNull()
  })

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
