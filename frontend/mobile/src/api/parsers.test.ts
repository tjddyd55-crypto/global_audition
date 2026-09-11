import {
  parseApplicationDetail,
  parseAuditionDto,
  parseCreditRuntime,
  parseInsufficientCredits,
  parseMyApplicationList,
  parsePreparePayment,
} from './parsers'

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

  it('크레딧 런타임 FREE/CREDIT를 서버 값으로 읽는다', () => {
    const free = parseCreditRuntime({
      applicationPaymentMode: 'FREE',
      applicationFeeCredits: 0,
      signupCreditEnabled: false,
      signupCreditAmount: 0,
    })
    expect(free.applicationPaymentMode).toBe('FREE')
    const credit = parseCreditRuntime({
      applicationPaymentMode: 'CREDIT',
      applicationFeeCredits: 3,
      signupCreditEnabled: true,
      signupCreditAmount: 10,
    })
    expect(credit.applicationPaymentMode).toBe('CREDIT')
    expect(credit.applicationFeeCredits).toBe(3)
    expect(credit.signupCreditAmount).toBe(10)
  })

  it('INSUFFICIENT_CREDITS 본문을 파싱한다', () => {
    const parsed = parseInsufficientCredits({
      success: false,
      code: 'INSUFFICIENT_CREDITS',
      requiredCredits: 5,
      currentCredits: 1,
      shortfallCredits: 4,
      message: '크레딧이 부족합니다.',
    })
    expect(parsed?.shortfallCredits).toBe(4)
    expect(parseInsufficientCredits({ message: 'no' })).toBeNull()
  })

  it('토스 prepare 응답에서 서버 확정 금액을 읽는다', () => {
    const prep = parsePreparePayment({
      orderNo: 'ORD-1',
      packageId: 'p1',
      packageName: 'Starter',
      amount: 10,
      tossAmount: 10,
      currency: 'USD',
      credits: 10,
      bonusCredits: 1,
      clientKey: 'test_ck_x',
      status: 'READY',
      tossMethod: 'FOREIGN_EASY_PAY',
      foreignEasyPayProvider: 'PAYPAL',
    })
    expect(prep.orderId).toBe('ORD-1')
    expect(prep.tossAmount).toBe(10)
    expect(prep.currency).toBe('USD')
    expect(prep.clientKey).toBe('test_ck_x')
    expect(prep.tossMethod).toBe('FOREIGN_EASY_PAY')
    expect(prep.foreignEasyPayProvider).toBe('PAYPAL')
  })
})
