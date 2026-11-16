import { AxiosError, AxiosHeaders } from 'axios'
import { isRankingAccessDenied } from './rankingAccess'

const err = (status: number) =>
  new AxiosError('x', String(status), undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data: {},
  })

describe('isRankingAccessDenied', () => {
  it('treats 401/403 as restricted, not a load failure', () => {
    expect(isRankingAccessDenied(err(401))).toBe(true)
    expect(isRankingAccessDenied(err(403))).toBe(true)
  })
  it('keeps other failures as errors', () => {
    expect(isRankingAccessDenied(err(500))).toBe(false)
    expect(isRankingAccessDenied(err(404))).toBe(false)
    expect(isRankingAccessDenied(new Error('network'))).toBe(false)
  })
})
