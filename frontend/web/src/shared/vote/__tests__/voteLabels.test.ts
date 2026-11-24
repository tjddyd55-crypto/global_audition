import { voteLabelKey } from '../voteLabels'

describe('voteLabelKey', () => {
  it('uses the singular English key only when the count is 1', () => {
    expect(voteLabelKey(1, 'en', 'ownVotes', 'ownVotesOne')).toBe('ownVotesOne')
    expect(voteLabelKey(0, 'en', 'ownVotes', 'ownVotesOne')).toBe('ownVotes')
    expect(voteLabelKey(2, 'en', 'ownVotes', 'ownVotesOne')).toBe('ownVotes')
  })

  it('keeps a single form for ko, mn, km and uz', () => {
    for (const loc of ['ko', 'mn', 'km', 'uz']) {
      expect(voteLabelKey(1, loc, 'ownVotes', 'ownVotesOne')).toBe('ownVotes')
      expect(voteLabelKey(2, loc, 'ownVotes', 'ownVotesOne')).toBe('ownVotes')
    }
  })
})
