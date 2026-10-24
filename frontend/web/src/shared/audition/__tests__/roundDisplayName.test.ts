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
  it('mn labels unify to N-р шат (incl. legacy "Шат N")', () => {
    expect(roundDisplayName(3, 'Шат 3', tFor('mn'))).toBe('3-р шат')
    expect(roundDisplayName(1, '1-р шат', tFor('mn'))).toBe('1-р шат')
    expect(roundDisplayName(4, null, tFor('mn'))).toBe('4-р шат')
  })
  it('mn catalog has no legacy "Шат {n}" round labels', () => {
    const raw = JSON.stringify(require('../../../../messages/mn.json'))
    expect(raw).not.toMatch(/Шат \{|: шат \{/)
    expect(raw).toContain('{n}-р шат')
  })
  it('custom names are preserved', () => {
    expect(roundDisplayName(2, '보컬 실기', tFor('en'))).toBe('Round 2 보컬 실기')
    expect(isDefaultRoundName('2차', 3)).toBe(false)
  })
})
