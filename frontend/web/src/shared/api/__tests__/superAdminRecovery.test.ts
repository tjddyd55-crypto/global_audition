import { unwrapData } from '../unwrap'

describe('admin recovery payload unwrap', () => {
  it('reads envelope data once for reissue', () => {
    const body = {
      success: true,
      data: { recoveryCode: 'ABCD-2345-EFGH', accountIdentifier: 'a@example.com' },
    }
    expect(unwrapData<{ recoveryCode: string }>(body).recoveryCode).toBe('ABCD-2345-EFGH')
  })

  it('does not treat a raw page as envelope', () => {
    const page = { content: [], totalElements: 0, totalPages: 0, size: 50, number: 0 }
    expect(unwrapData(page)).toEqual(page)
  })
})
