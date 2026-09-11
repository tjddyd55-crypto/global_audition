import {
  agencyBoardStatusLabel,
  agencyConfirmMessage,
  applicationResultCopy,
  applicationStatusLabel,
  auditionStatusLabel,
  nationalityLabel,
  roundSubmissionLabel,
} from './statusLabels'

describe('statusLabels — 백엔드 문자열만 매핑', () => {
  it('오디션 상태를 카탈로그 라벨로 보여 준다', () => {
    expect(auditionStatusLabel('OPEN')).toBe('모집중')
    expect(auditionStatusLabel('CLOSED')).toBe('마감')
    expect(auditionStatusLabel('DRAFT')).toBe('초안')
    expect(auditionStatusLabel('OPEN', '2차 모집 중')).toBe('2차 모집 중')
  })

  it('지원자 상태와 레거시 REVIEWED를 카탈로그 reviewing으로 본다', () => {
    expect(applicationStatusLabel('SUBMITTED')).toBe('제출됨')
    expect(applicationStatusLabel('REVIEWING')).toBe('심사중')
    expect(applicationStatusLabel('REVIEWED')).toBe('심사중')
    expect(applicationStatusLabel('ACCEPTED')).toBe('합격')
    expect(applicationStatusLabel('REJECTED')).toBe('불합격')
  })

  it('기획사 보드 상태를 카탈로그와 같게 둔다', () => {
    expect(agencyBoardStatusLabel('PENDING')).toBe('대기')
    expect(agencyBoardStatusLabel('REVIEWING')).toBe('심사중')
    expect(agencyBoardStatusLabel('APPROVED')).toBe('합격')
    expect(agencyBoardStatusLabel('REJECTED')).toBe('불합격')
    expect(agencyConfirmMessage('APPROVED')).toContain('합격')
  })

  it('알 수 없는 값은 새 enum으로 바꾸지 않고 원문을 반환한다', () => {
    expect(applicationStatusLabel('UNKNOWN_FROM_SERVER')).toBe('UNKNOWN_FROM_SERVER')
    expect(roundSubmissionLabel('PASSED')).toBe('라운드 통과')
    expect(nationalityLabel('KR')).toBe('한국')
  })

  it('결과 문구는 차분하게 유지한다', () => {
    expect(applicationResultCopy('REJECTED')).toContain('다음 기회')
    expect(applicationResultCopy('ACCEPTED')).toContain('합격')
  })
})
