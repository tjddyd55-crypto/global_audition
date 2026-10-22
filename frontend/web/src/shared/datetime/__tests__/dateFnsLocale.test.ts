import { dateFnsLocale } from '../dateFnsLocale'

describe('dateFnsLocale', () => {
  it('follows the UI locale instead of a fixed Korean date locale', () => {
    expect(dateFnsLocale('ko').code).toBe('ko')
    expect(dateFnsLocale('ko-KR').code).toBe('ko')
    expect(dateFnsLocale('mn').code).toBe('mn')
    expect(dateFnsLocale('en').code).toBe('en-US')
    expect(dateFnsLocale('en').code).not.toBe('ko')
  })
})
