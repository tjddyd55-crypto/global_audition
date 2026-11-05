import { AGENCY_APPROVAL_SUCCESS_NOTICE } from '../approvalNotice'

describe('AGENCY_APPROVAL_SUCCESS_NOTICE', () => {
  it('uses the Korean success copy for the super-admin agencies screen', () => {
    expect(AGENCY_APPROVAL_SUCCESS_NOTICE).toBe('처리되었습니다')
  })
})
