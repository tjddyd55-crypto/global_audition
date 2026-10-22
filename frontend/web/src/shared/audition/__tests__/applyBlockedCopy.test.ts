import { PREV_ROUND_APPLY_BLOCKED_CODE, applyBlockedDisplayMessage } from '../applyBlockedCopy'
import { mapApplySubmitError } from '../mapApplySubmitError'

const PREV = 'Only previous-round passers can apply'
const GENERIC = 'Apply failed'
const RAW = '이전 라운드 합격자만 지원 가능합니다'

describe('apply blocked copy', () => {
  it('renders the catalog string from the code and never the API message', () => {
    expect(applyBlockedDisplayMessage(PREV_ROUND_APPLY_BLOCKED_CODE, PREV, GENERIC)).toBe(PREV)
    expect(applyBlockedDisplayMessage(undefined, PREV, GENERIC)).toBe(PREV)
    expect(applyBlockedDisplayMessage('OTHER', PREV, GENERIC)).toBe(GENERIC)
    expect(applyBlockedDisplayMessage(PREV_ROUND_APPLY_BLOCKED_CODE, PREV, GENERIC)).not.toBe(RAW)
  })

  it('maps HTTP 403 through the display-error policy instead of the Korean body', () => {
    const err = {
      isAxiosError: true,
      message: 'Request failed with status code 403',
      response: { status: 403, data: { message: RAW } },
    }
    const translate = (key: string) => (key === 'uploader.forbidden' ? 'No permission to upload' : key)
    const shown = mapApplySubmitError(err, translate, { alreadyDone: 'done', failed: GENERIC })
    expect(shown).toBe('No permission to upload')
    expect(shown).not.toContain('이전')
  })

  it('uses the already-applied catalog for 409 and does not surface the server message', () => {
    const err = {
      isAxiosError: true,
      message: 'Request failed with status code 409',
      response: { status: 409, data: { message: '이미 지원 완료입니다.' } },
    }
    const shown = mapApplySubmitError(err, (key) => key, { alreadyDone: 'Already applied', failed: GENERIC })
    expect(shown).toBe('Already applied')
  })
})
