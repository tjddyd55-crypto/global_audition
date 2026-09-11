import { formatCurrency, formatWholeUsd, isWholeUsdDollars, parseWholeUsdDollars, SETTLEMENT_CURRENCY } from '../currency'

describe('USD settlement display', () => {
  it('formats as USD not KRW', () => {
    expect(SETTLEMENT_CURRENCY).toBe('USD')
    expect(formatCurrency(10, 'en')).toMatch(/10/)
    expect(formatCurrency(10, 'en')).not.toContain('₩')
    expect(formatCurrency(10, 'ko')).not.toContain('₩')
  })

  it('accepts only whole dollars', () => {
    expect(parseWholeUsdDollars('5')).toBe(5)
    expect(parseWholeUsdDollars('4.99')).toBe(0)
    expect(parseWholeUsdDollars('10.00')).toBe(10)
    expect(isWholeUsdDollars(10)).toBe(true)
    expect(isWholeUsdDollars(4.99)).toBe(false)
    expect(isWholeUsdDollars(0)).toBe(false)
  })

  it('does not invent cents for Toss display', () => {
    expect(formatCurrency(10, 'en')).not.toMatch(/4\.99/)
    expect(formatCurrency(10, 'mn')).toMatch(/10/)
  })

  it('prints integer dollars only', () => {
    expect(formatWholeUsd(10)).toBe('$10')
    expect(formatWholeUsd(1)).toBe('$1')
    expect(formatWholeUsd(5)).toBe('$5')
    expect(formatWholeUsd(10)).not.toContain('.00')
    expect(formatCurrency(10, 'en')).toBe('$10')
  })
})
