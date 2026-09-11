import { formatCurrency, isWholeUsdDollars, parseWholeUsdDollars, SETTLEMENT_CURRENCY } from '../currency'

describe('USD settlement display', () => {
  it('formats as USD not KRW', () => {
    expect(SETTLEMENT_CURRENCY).toBe('USD')
    expect(formatCurrency(10, 'en')).toContain('10.00')
    expect(formatCurrency(10, 'en')).not.toContain('₩')
    expect(formatCurrency(10, 'ko')).not.toContain('₩')
  })

  it('accepts only whole dollars', () => {
    expect(parseWholeUsdDollars('5')).toBe(5)
    expect(parseWholeUsdDollars('4.99')).toBe(0)
    expect(isWholeUsdDollars(10)).toBe(true)
    expect(isWholeUsdDollars(4.99)).toBe(false)
  })
})
