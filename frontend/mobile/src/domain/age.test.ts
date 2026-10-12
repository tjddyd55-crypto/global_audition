import { calculateAge } from './age'

describe('calculateAge', () => {
  it('YYYY-MM-DD만 계산하고 잘못된 값은 null이다', () => {
    expect(calculateAge('not-a-date')).toBeNull()
    expect(calculateAge('1990-01-01')).toBeGreaterThan(20)
  })
})
