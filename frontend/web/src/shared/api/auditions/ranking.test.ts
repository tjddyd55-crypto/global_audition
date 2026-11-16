import { parseRankingPage } from './ranking'

describe('parseRankingPage', () => {
  it('public response has only public fields and round info', () => {
    const p = parseRankingPage({
      votingEnabled: true,
      roundNumber: 3,
      manageView: false,
      items: [{ applicationId: 'a', userName: 'Kim', avatarUrl: 'https://x/a.png', voteCount: 4, rank: 1, isVoted: true }],
    })
    expect(p.roundNumber).toBe(3)
    expect(p.manageView).toBe(false)
    expect(p.items[0]).toMatchObject({ userName: 'Kim', avatarUrl: 'https://x/a.png', voteCount: 4, rank: 1, isVoted: true, status: '', score: 0 })
  })
  it('disabled round and missing avatar', () => {
    const p = parseRankingPage({ votingEnabled: false, items: [{ applicationId: 'b', avatarUrl: '  ' }] })
    expect(p.votingEnabled).toBe(false)
    expect(p.items[0].avatarUrl).toBeNull()
    expect(parseRankingPage(undefined)).toEqual({ votingEnabled: true, roundNumber: 1, manageView: false, items: [] })
  })
})
