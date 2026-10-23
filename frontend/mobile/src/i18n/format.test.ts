import { formatUsd, SETTLEMENT_CURRENCY } from './format'

describe('native USD formatter', () => {
  it('matches web contract: whole USD dollars, no KRW', () => {
    expect(SETTLEMENT_CURRENCY).toBe('USD')
    expect(formatUsd(10, 'en')).toMatch(/10/)
    expect(formatUsd(10, 'en')).not.toContain('₩')
    expect(formatUsd(10, 'ko')).not.toContain('₩')
    expect(formatUsd(10, 'mn')).toMatch(/10/)
    expect(formatUsd(10, 'en')).toBe('$10')
    expect(formatUsd(10, 'en')).not.toContain('.00')
  })
})
