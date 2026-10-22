import { authoringLocaleOrFallback } from '@/shared/audition/audience'
import { resolveApplicationFeeUsd } from '@/shared/api/credits'
import { translationTabLabel } from '@/shared/audition/translationTabLabel'

describe('global audition authoring and fee', () => {
  it('작성 언어는 8개 밖 태그도 유지한다', () => {
    expect(authoringLocaleOrFallback('pt-BR')).toBe('pt-br')
    expect(authoringLocaleOrFallback('ja')).toBe('ja')
    expect(authoringLocaleOrFallback('!!!')).toBe('ko')
  })

  it('지원비는 서버 USD 정수만 읽고 소수점은 거절한다', () => {
    expect(resolveApplicationFeeUsd({ applicationFeeUsd: 2, applicationFeeCredits: 9, cost: 9 })).toBe(2)
    expect(resolveApplicationFeeUsd({ applicationFeeCredits: 3, cost: 9 })).toBe(3)
    expect(resolveApplicationFeeUsd({ applicationFeeUsd: 1.5, applicationFeeCredits: 4 })).toBe(4)
    expect(resolveApplicationFeeUsd(null)).toBe(0)
  })

  it('번역 탭은 수동 보존과 stale 실패를 구분한다', () => {
    expect(translationTabLabel(undefined)).toBe('missing')
    expect(
      translationTabLabel({
        auditionId: 'a',
        locale: 'en',
        title: 'Hi',
        description: '',
        location: '',
        agencyName: '',
        recruitFields: [],
        qualifications: [],
        schedules: [],
        benefits: [],
        status: 'COMPLETED',
        provider: 'MANUAL',
        origin: 'MANUAL',
        manuallyEdited: true,
        stale: true,
      }),
    ).toBe('stale')
    expect(
      translationTabLabel({
        auditionId: 'a',
        locale: 'en',
        title: '',
        description: '',
        location: '',
        agencyName: '',
        recruitFields: [],
        qualifications: [],
        schedules: [],
        benefits: [],
        status: 'FAILED',
        provider: 'OPENAI_COMPATIBLE',
        errorCode: 'NOT_CONFIGURED',
      }),
    ).toBe('failed')
  })
})
