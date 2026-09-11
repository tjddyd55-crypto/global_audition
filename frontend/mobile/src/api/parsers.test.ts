import { parseApplicationDetail, parseAuditionDto, parseMyApplicationList } from './parsers'

describe('parsers', () => {
  it('오디션 DTO에서 currentRoundNumber/maxRoundNumber를 서버 값 그대로 읽는다', () => {
    const dto = parseAuditionDto({
      id: 'a1',
      title: 'Summer',
      status: 'OPEN',
      processMode: 'MULTI_ROUND',
      currentRoundNumber: 2,
      maxRoundNumber: 4,
      tags: ['vocal'],
      recruitFields: [],
      qualifications: [],
      schedules: [],
      benefits: [],
      galleryImages: [],
    })
    expect(dto.processMode).toBe('MULTI_ROUND')
    expect(dto.currentRoundNumber).toBe(2)
    expect(dto.maxRoundNumber).toBe(4)
    expect(dto.status).toBe('OPEN')
  })

  it('지원 상세에서 서버 maxRoundNumber를 그대로 읽는다', () => {
    const detail = parseApplicationDetail({
      applicationId: 'app-2',
      auditionId: 'aud-2',
      auditionTitle: 'Round',
      status: 'SUBMITTED',
      processMode: 'MULTI_ROUND',
      currentRoundNumber: 2,
      maxRoundNumber: 5,
      roundSummaries: [{ roundId: 'r2', roundNumber: 2 }],
      snsLinks: [],
      videos: [],
    })
    expect(detail.currentRoundNumber).toBe(2)
    expect(detail.maxRoundNumber).toBe(5)
  })

  it('내 지원 목록 applicationId를 id로 정규화한다', () => {
    const items = parseMyApplicationList({
      items: [{ applicationId: 'app-1', auditionId: 'aud-1', auditionTitle: 'A', appliedAt: '2026-01-01', status: 'SUBMITTED' }],
      total: 1,
    })
    expect(items[0]?.id).toBe('app-1')
    expect(items[0]?.status).toBe('SUBMITTED')
  })
})
