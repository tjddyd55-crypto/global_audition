import { formatVoteDate } from '../voteDate'

describe('formatVoteDate', () => {
  const date = '2026-11-30T13:38:08Z'
  it.each(['ko', 'en', 'mn', 'km', 'uz'])('uses minute precision in %s', (locale) => {
    expect(formatVoteDate(date, locale)).toBe(new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium', timeStyle: 'short',
    }).format(new Date(date)))
    expect(formatVoteDate(date, locale)).toBe(formatVoteDate('2026-11-30T13:38:59Z', locale))
  })
  it('handles missing dates and malformed locales without crashing', () => {
    expect(formatVoteDate(null, 'ko')).toBe('')
    expect(formatVoteDate('invalid', 'ko')).toBe('')
    expect(formatVoteDate(date, 'bad_locale')).toBe(formatVoteDate(date, 'en'))
  })
})
