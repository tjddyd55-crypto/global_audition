import { parseEntryNumber, parseNumberHistory, numberHistoryLabelKey } from '../entryNumbers'
import { parsePublicVoteItem } from '@/shared/api/auditions/parsers'

it('never substitutes rank for an identity number', () => {
  expect(parsePublicVoteItem({ applicationId: 'a', candidateNumber: 5, rank: 1 }).candidateNumber).toBe(5)
  expect(parsePublicVoteItem({ applicationId: 'a', rank: 1 }).candidateNumber).toBeUndefined()
})
it.each([0, -1, 1.2, NaN, Infinity, true, null, '', 'bad', Number.MAX_SAFE_INTEGER + 1])('rejects invalid number %p', (value) => {
  expect(parseEntryNumber(value)).toBeUndefined()
})
it('parses separate persisted histories beyond the third/fourth round', () => {
  const history = parseNumberHistory([{ kind: 'RECEIPT', roundNumber: 0, number: 100 }, { kind: 'REVIEW', roundNumber: 5, number: 30 }, { kind: 'VOTE', roundNumber: 5, number: 1 }])
  expect(history.map((row) => row.number)).toEqual([100, 30, 1])
  expect(history.map((row) => numberHistoryLabelKey(row.kind))).toEqual(['receiptNumber', 'reviewNumber', 'voteNumberHistory'])
  expect(parseNumberHistory([{ kind: 'VOTE', roundNumber: 0, number: 3 }, { kind: 'REVIEW', roundNumber: 2, number: 0 }])).toEqual([])
})
