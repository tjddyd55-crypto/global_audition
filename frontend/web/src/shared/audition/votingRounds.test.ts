import {
  initialVotingForm,
  normalizeRounds,
  parseAuditionVotingFields,
  presetOf,
  roundsForPreset,
  toggleRound,
} from './votingRounds'

describe('votingRounds', () => {
  it('presets', () => {
    expect(roundsForPreset('NONE', 3)).toEqual([])
    expect(roundsForPreset('FINAL', 3)).toEqual([3])
    expect(roundsForPreset('ALL', 3)).toEqual([1, 2, 3])
  })
  it('detects preset from rounds', () => {
    expect(presetOf(3, [])).toBe('NONE')
    expect(presetOf(3, [3])).toBe('FINAL')
    expect(presetOf(3, [1, 2, 3])).toBe('ALL')
    expect(presetOf(3, [1, 3])).toBe('CUSTOM')
    expect(presetOf(1, [1])).toBe('ALL')
  })
  it('toggles and normalizes within count', () => {
    expect(toggleRound([3], 1, 3)).toEqual([1, 3])
    expect(toggleRound([1, 3], 3, 3)).toEqual([1])
    expect(normalizeRounds([5, 2, 2, 0], 3)).toEqual([2])
  })
  it('parses API fields with legacy defaults', () => {
    expect(parseAuditionVotingFields({})).toEqual({ votingRoundCount: null, votingRounds: null, votingEnabled: true, votingRoundNumber: 1 })
    expect(parseAuditionVotingFields({ votingRoundCount: 3, votingRounds: [3], votingEnabled: false, votingRoundNumber: 1 })).toEqual({
      votingRoundCount: 3,
      votingRounds: [3],
      votingEnabled: false,
      votingRoundNumber: 1,
    })
  })
  it('edit form shows legacy (null) as all rounds', () => {
    expect(initialVotingForm({ votingRoundCount: null, votingRounds: null })).toEqual({ count: 1, rounds: [1] })
    expect(initialVotingForm({ votingRoundCount: 3, votingRounds: [] })).toEqual({ count: 3, rounds: [] })
    expect(initialVotingForm(undefined)).toEqual({ count: 1, rounds: [1] })
  })
})
