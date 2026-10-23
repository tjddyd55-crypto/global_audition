import { formatMinorAmount } from './minor'

describe('formatMinorAmount', () => {
  it('prints KRW and USD without floating point', () => {
    expect(formatMinorAmount(1300, 0, 'KRW')).toBe('1300 KRW')
    expect(formatMinorAmount(2600, 0, 'KRW')).toBe('2600 KRW')
    expect(formatMinorAmount(200, 2, 'USD')).toBe('2.00 USD')
  })
})
