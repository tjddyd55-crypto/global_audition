import { canShowVoting, canViewRanking, isRankingAccessDenied, rankingAvatar, rankingViewState } from './ranking'

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
  it('ranking entry is public for voting rounds (no owner check)', () => {
    expect(canViewRanking({ votingEnabled: true })).toBe(true)
    expect(canViewRanking({})).toBe(true)
    expect(canViewRanking({ votingEnabled: false })).toBe(false)
  })
})

describe('rankingAvatar', () => {
  it('uses absolute non-svg image, else initial', () => {
    expect(rankingAvatar({ avatarUrl: 'https://cdn/x.jpg', userName: 'kim' })).toEqual({ uri: 'https://cdn/x.jpg', initial: 'K' })
    expect(rankingAvatar({ avatarUrl: 'https://cdn/x.svg', userName: '박' }).uri).toBeNull()
    expect(rankingAvatar({ avatarUrl: '/uploads/a.png', userName: '' })).toEqual({ uri: null, initial: '?' })
  })
})

describe('per-round voting plan', () => {
  it('disabled round shows disabled state instead of an error', () => {
    expect(rankingViewState({ isLoading: false, error: null, count: 0, votingEnabled: false })).toBe('disabled')
    expect(rankingViewState({ isLoading: false, error: null, count: 2 })).toBe('list')
  })
  it('hides vote/ranking entry when voting is off for the current round', () => {
    expect(canShowVoting({ votingEnabled: false })).toBe(false)
    expect(canShowVoting({})).toBe(true)
    expect(canShowVoting({ votingEnabled: true, voteStatus: 'SCHEDULED' })).toBe(false)
    expect(canShowVoting({ votingEnabled: true, voteStatus: 'OPEN' })).toBe(true)
    expect(canViewRanking({ votingEnabled: false, voteStatus: 'CLOSED' })).toBe(true)
    expect(canViewRanking({ votingEnabled: false, voteStatus: 'NOT_STARTED' })).toBe(false)
    expect(canViewRanking({ votingEnabled: false })).toBe(false)
  })
})
