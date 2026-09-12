import { messageForReasonCode, REASON_ERROR_CODES } from '../reasonMessages'
import ko from '../../../../messages/ko.json'

describe('messageForReasonCode', () => {
  const errors = (ko as { errors: Record<string, string> }).errors
  const translate = (code: string) => errors[code] ?? `errors.${code}`

  it('maps known reason codes from the catalog', () => {
    expect(messageForReasonCode('PREVIOUS_ROUND_NOT_PASSED', translate, errors.GENERIC)).toBe(
      errors.PREVIOUS_ROUND_NOT_PASSED,
    )
  })

  it('returns fallback for empty input', () => {
    expect(messageForReasonCode(null, translate, errors.GENERIC)).toBe(errors.GENERIC)
  })

  it('keeps catalog keys for every reason code', () => {
    for (const code of REASON_ERROR_CODES) {
      expect(errors[code]?.trim().length).toBeGreaterThan(0)
    }
  })
})
