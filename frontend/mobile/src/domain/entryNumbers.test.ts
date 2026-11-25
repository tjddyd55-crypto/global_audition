import { parseVoteItem, parseManageApplications, parseAgencyDetail } from '../api/parsers'
it('keeps vote numbers separate from ranks and management numbers', () => {
  expect(parseVoteItem({ applicationId: 'a', rank: 1, candidateNumber: 5 }).candidateNumber).toBe(5)
  expect(parseVoteItem({ applicationId: 'a', rank: 1 }).candidateNumber).toBeUndefined()
  const manage = parseManageApplications({ items: [{ applicationId: 'a', applicantNumber: 100, numberScopeRound: 0 }] })
  expect(manage.items[0].applicantNumber).toBe(100)
  const detail = parseAgencyDetail({ numberHistory: [{ kind: 'RECEIPT', number: 100, roundNumber: 0 }, { kind: 'REVIEW', number: 30, roundNumber: 5 }] })
  expect(detail.numberHistory?.map((n) => n.number)).toEqual([100, 30])
})
