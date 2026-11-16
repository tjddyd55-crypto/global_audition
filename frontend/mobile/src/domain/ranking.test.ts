import { canViewRanking, isRankingAccessDenied, rankingViewState } from './ranking'

const apiError = (status: number) => Object.assign(new Error('x'), { status })

describe('rankingViewState', () => {
  it('shows empty (not error) for a zero-vote audition the owner can read', () => {
    expect(rankingViewState({ isLoading: false, error: null, count: 0 })).toBe('empty')
  })
  it('shows list when there are items', () => {
    expect(rankingViewState({ isLoading: false, error: null, count: 2 })).toBe('list')
  })
  it('maps 401/403 (applicant, guest, other agency) to restricted notice', () => {
    expect(rankingViewState({ isLoading: false, error: apiError(403), count: 0 })).toBe('restricted')
    expect(rankingViewState({ isLoading: false, error: apiError(401), count: 0 })).toBe('restricted')
  })
  it('keeps real failures as errors', () => {
    expect(rankingViewState({ isLoading: false, error: apiError(500), count: 0 })).toBe('error')
    expect(rankingViewState({ isLoading: false, error: new TypeError('Network request failed'), count: 0 })).toBe('error')
    expect(isRankingAccessDenied(apiError(404))).toBe(false)
  })
  it('loading wins', () => {
    expect(rankingViewState({ isLoading: true, error: null, count: 0 })).toBe('loading')
  })
})

describe('canViewRanking', () => {
  it('only the owning agency sees the ranking entry', () => {
    expect(canViewRanking({ role: 'AGENCY', userId: 'owner' }, 'owner')).toBe(true)
    expect(canViewRanking({ role: 'AGENCY', userId: 'other' }, 'owner')).toBe(false)
    expect(canViewRanking({ role: 'APPLICANT', userId: 'owner' }, 'owner')).toBe(false)
    expect(canViewRanking(null, 'owner')).toBe(false)
    expect(canViewRanking({ role: 'AGENCY', userId: '' }, '')).toBe(false)
  })
})
