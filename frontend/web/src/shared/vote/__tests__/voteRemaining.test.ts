import { canShowPublicVoteCount, voteRefreshInterval, voteRemaining } from '../voteRemaining'

test('refreshes around the scheduled start and current end without polling closed votes', () => {
  const now = Date.parse('2026-11-24T00:00:00Z')
  const close = '2026-11-24T00:00:02Z'
  expect(voteRefreshInterval({ voteStatus: 'SCHEDULED', voteStartAt: close }, now)).toBe(2250)
  expect(voteRefreshInterval({ voteStatus: 'OPEN', voteEndAt: close }, now)).toBe(2250)
  expect(voteRefreshInterval({ voteStatus: 'OPEN', voteEndAt: close }, now + 3000)).toBe(5000)
  expect(voteRefreshInterval({ voteStatus: 'CLOSED', voteEndAt: close }, now + 3000)).toBe(false)
})

describe('canShowPublicVoteCount', () => {
  it('follows the public ranking policy: visible only after start', () => {
    expect(canShowPublicVoteCount('OPEN')).toBe(true)
    expect(canShowPublicVoteCount('CLOSED')).toBe(true)
    expect(canShowPublicVoteCount('SCHEDULED')).toBe(false)
    expect(canShowPublicVoteCount('NOT_STARTED')).toBe(false)
    expect(canShowPublicVoteCount(null)).toBe(false)
  })
})

describe('voteRemaining', () => {
  const now = new Date('2026-11-24T00:00:00Z')

  it('returns none for missing or invalid end times', () => {
    expect(voteRemaining(null, now)).toEqual({ kind: 'none' })
    expect(voteRemaining('not-a-date', now)).toEqual({ kind: 'none' })
  })

  it('reports ended, minutes, hours, or days', () => {
    expect(voteRemaining('2026-11-23T23:00:00Z', now)).toEqual({ kind: 'ended' })
    expect(voteRemaining('2026-11-24T00:20:00Z', now)).toEqual({ kind: 'minutes', n: 20 })
    expect(voteRemaining('2026-11-24T05:00:00Z', now)).toEqual({ kind: 'hours', n: 5 })
    expect(voteRemaining('2026-11-30T00:00:00Z', now)).toEqual({ kind: 'days', n: 6 })
  })
})
