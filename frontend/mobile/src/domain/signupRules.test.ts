import { validateSignupDraft } from './signupRules'

describe('validateSignupDraft', () => {
  const valid = {
    email: 'user@example.com',
    password: 'secret1',
    nickname: '지원자닉',
    role: 'APPLICANT' as const,
  }

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
