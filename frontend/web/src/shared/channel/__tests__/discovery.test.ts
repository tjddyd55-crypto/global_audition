import fs from 'fs'
import path from 'path'
import { CAREER_CATEGORIES, CHANNEL_FIELD_FILTERS, CHANNEL_LANGUAGE_CODES, CHANNEL_SORTS, formatCareerPeriod, isChannelSort, isFieldFilter } from '../discovery'
import { RECRUIT_FIELD_CODES } from '../../audition/recruitFields'

const ko = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../../messages/ko.json'), 'utf8'))

describe('channel discovery constants', () => {
  it('only filters by shared recruit field codes (plus ALL/OTHER)', () => {
    for (const f of CHANNEL_FIELD_FILTERS) {
      if (f === 'ALL' || f === 'OTHER') continue
      expect(RECRUIT_FIELD_CODES).toContain(f)
    }
    expect(isFieldFilter('INFLUENCER')).toBe(true)
    expect(isFieldFilter('PRODUCING')).toBe(false)
  })

  it('has catalog labels for every sort, career category and language', () => {
    for (const s of CHANNEL_SORTS) expect(ko.channel.sort[s]).toBeTruthy()
    for (const c of CAREER_CATEGORIES) expect(ko.channel.careerCategory[c]).toBeTruthy()
    for (const l of CHANNEL_LANGUAGE_CODES) expect(ko.languages[l]).toBeTruthy()
    expect(isChannelSort('POPULAR')).toBe(true)
    expect(isChannelSort('RANDOM')).toBe(false)
  })

  it('formats career periods', () => {
    expect(formatCareerPeriod('2021-03', null, 'Present')).toBe('2021.03 – Present')
    expect(formatCareerPeriod('2020', '2022')).toBe('2020 – 2022')
    expect(formatCareerPeriod('2020', '2020')).toBe('2020')
    expect(formatCareerPeriod(null, null)).toBe('')
  })
})
