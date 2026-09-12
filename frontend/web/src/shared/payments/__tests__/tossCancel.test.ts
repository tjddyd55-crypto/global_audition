import { isTossCancelCode } from '../tossCancel'

describe('isTossCancelCode', () => {
  it('treats official Toss cancel codes as cancel', () => {
    expect(isTossCancelCode('PAY_PROCESS_CANCELED')).toBe(true)
    expect(isTossCancelCode('PAYER_CANCELLED')).toBe(true)
    expect(isTossCancelCode('USER_CANCEL')).toBe(true)
  })

  it('does not treat payment failures as cancel', () => {
    expect(isTossCancelCode('INVALID_CARD_NUMBER')).toBe(false)
    expect(isTossCancelCode('REJECT_CARD_COMPANY')).toBe(false)
    expect(isTossCancelCode('')).toBe(false)
    expect(isTossCancelCode(null)).toBe(false)
  })
})
