/**
 * 백엔드 ReasonCode.name() 또는 ApiFailResponse.message 와 매핑되는 사용자 문구.
 */
export const REASON_MESSAGE_MAP: Record<string, string> = {
  UNDER_REVIEW_LOCKED: '심사 중입니다.',
  ROUND_NOT_ACTIVE: '접수 기간이 아닙니다.',
  NOT_ELIGIBLE_ROUND: '지원 대상이 아닙니다.',
  SUBMISSION_NOT_FOUND: '제출 정보를 찾을 수 없습니다',
  NOT_MULTI_ROUND: '다단계 오디션이 아닙니다',
  AUDITION_ROUND_MISMATCH: '오디션과 라운드가 일치하지 않습니다',
  APPLICATION_NOT_FOUND: '지원서를 찾을 수 없습니다',
  AUDITION_NOT_FOUND: '오디션을 찾을 수 없습니다',
  ROUND_NOT_FOUND: '라운드를 찾을 수 없습니다',
  AUDITION_NOT_OPEN: '모집 중인 오디션이 아닙니다',
  APPLICATION_CLOSED: '이미 종료된 지원입니다',
  WRONG_CURRENT_ROUND: '현재 진행 라운드가 아닙니다',
  PREVIOUS_ROUND_NOT_PASSED: '이전 라운드를 통과하지 않았습니다',
  NO_SUBMISSION_ROW: '제출 준비 중입니다. 잠시 후 다시 시도해 주세요',
  SUBMISSION_CLOSED: '이 라운드는 더 이상 제출할 수 없습니다',
  ROUND_ALREADY_DECIDED: '이미 심사가 완료된 라운드입니다',
}

export function messageForReasonCode(reasonOrMessage: string | null | undefined): string {
  if (reasonOrMessage == null || reasonOrMessage === '') {
    return '요청을 처리할 수 없습니다'
  }
  return REASON_MESSAGE_MAP[reasonOrMessage] ?? reasonOrMessage
}

export function extractMeApiErrorMessage(err: unknown): string | null {
  const e = err as { response?: { data?: { message?: string } } }
  const m = e.response?.data?.message
  return typeof m === 'string' && m.length > 0 ? m : null
}
