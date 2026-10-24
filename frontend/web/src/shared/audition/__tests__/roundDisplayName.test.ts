import { isDefaultRoundName, roundDisplayName } from '../roundDisplayName'

const msgs: Record<string, Record<string, string>> = {
  ko: { roundLabel: '{n}차', roundName: '{n}차 {name}' },
  en: { roundLabel: 'Round {n}', roundName: 'Round {n} {name}' },
  mn: { roundLabel: '{n}-р шат', roundName: '{n}-р шат {name}' },
}
const tFor = (l: string) => (k: string, v?: Record<string, string | number>) =>
  msgs[l][k].replace(/\{(\w+)\}/g, (_, x) => String(v?.[x] ?? ''))

describe('roundDisplayName', () => {
  it('legacy server defaults become locale labels', () => {
    expect(roundDisplayName(1, '1차', tFor('en'))).toBe('Round 1')
    expect(roundDisplayName(2, '2차', tFor('mn'))).toBe('2-р шат')
    expect(roundDisplayName(3, '', tFor('ko'))).toBe('3차')
    expect(roundDisplayName(2, null, tFor('en'))).toBe('Round 2')
    expect(roundDisplayName(1, 'Round 1', tFor('ko'))).toBe('1차')
  })
  it('custom names are preserved', () => {
    expect(roundDisplayName(2, '보컬 실기', tFor('en'))).toBe('Round 2 보컬 실기')
    expect(isDefaultRoundName('2차', 3)).toBe(false)
  })
})
