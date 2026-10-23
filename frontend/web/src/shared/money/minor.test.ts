import { formatMinorAmount, formatMinorGrouped } from './minor'

describe('formatMinorGrouped', () => {
  it('groups KRW and keeps USD fraction digits', () => {
    expect(formatMinorGrouped(1300, 'KRW', 'ko')).toBe('1,300 KRW')
    expect(formatMinorGrouped(200, 'USD', 'ko')).toBe('2.00 USD')
    expect(formatMinorGrouped(12500, 'JPY', 'ko')).toBe('12,500 JPY')
  })
})

describe('formatMinorAmount', () => {
  it('prints KRW and USD without floating point', () => {
    expect(formatMinorAmount(1300, 0, 'KRW')).toBe('1,300 KRW')
    expect(formatMinorAmount(2600, 0, 'KRW')).toBe('2,600 KRW')
    expect(formatMinorAmount(13000, 0, 'KRW')).toBe('13,000 KRW')
    expect(formatMinorAmount(200, 2, 'USD')).toBe('2.00 USD')
    expect(formatMinorAmount(123456, 2, 'USD')).toBe('1,234.56 USD')
  })
})
