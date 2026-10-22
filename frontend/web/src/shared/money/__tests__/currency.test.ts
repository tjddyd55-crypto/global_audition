import { formatCount, formatCurrency, formatUsdAmount, formatWholeUsd, isWholeUsdDollars, parseWholeUsdDollars, SETTLEMENT_CURRENCY } from '../currency'

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

  it('groups screen counts and USD with Intl separators', () => {
    expect(formatCount(1234, 'en')).toBe('1,234')
    expect(formatCount(1234, 'ko')).toBe('1,234')
    expect(formatCount(2000, 'en')).toBe('2,000')
    expect(formatCount(12500, 'ko')).toBe('12,500')
    expect(formatUsdAmount(1234, 'en')).toBe('1,234 USD')
    expect(formatUsdAmount(2000, 'en')).toBe('2,000 USD')
    expect(formatUsdAmount(1234.56, 'en')).toBe('1,234.56 USD')
    expect(formatUsdAmount(12500.5, 'en')).toBe('12,500.50 USD')
    expect(formatUsdAmount('0.20', 'en')).toBe('0.20 USD')
    expect(formatUsdAmount(1234.56, 'ko')).toContain('1,234')
  })

  it('prints integer dollars only', () => {
    expect(formatWholeUsd(10)).toBe('$10')
    expect(formatWholeUsd(1)).toBe('$1')
    expect(formatWholeUsd(5)).toBe('$5')
    expect(formatWholeUsd(10)).not.toContain('.00')
    expect(formatCurrency(10, 'en')).toBe('$10')
  })
})
