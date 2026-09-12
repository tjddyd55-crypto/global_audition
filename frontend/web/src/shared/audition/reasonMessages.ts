/**
 * 백엔드 ReasonCode.name() 또는 ApiFailResponse.message 와 매핑되는 사용자 문구.
 * 문구는 messages.errors SSOT — 화면은 translate(code)만 호출한다.
 */
export const REASON_ERROR_CODES = [
  'UNDER_REVIEW_LOCKED',
  'ROUND_NOT_ACTIVE',
  'NOT_ELIGIBLE_ROUND',
  'SUBMISSION_NOT_FOUND',
  'NOT_MULTI_ROUND',
  'AUDITION_ROUND_MISMATCH',
  'APPLICATION_NOT_FOUND',
  'AUDITION_NOT_FOUND',
  'ROUND_NOT_FOUND',
  'AUDITION_NOT_OPEN',
  'APPLICATION_CLOSED',
  'WRONG_CURRENT_ROUND',
  'PREVIOUS_ROUND_NOT_PASSED',
  'NO_SUBMISSION_ROW',
  'SUBMISSION_CLOSED',
  'ROUND_ALREADY_DECIDED',
] as const

export function messageForReasonCode(
  reasonOrMessage: string | null | undefined,
  translate: (code: string) => string,
  fallback: string,
): string {
  if (reasonOrMessage == null || reasonOrMessage === '') {
    return fallback
  }
  const mapped = translate(reasonOrMessage)
  if (!mapped || mapped === reasonOrMessage || mapped === `errors.${reasonOrMessage}`) {
    return reasonOrMessage
  }
  return mapped
}

export function extractMeApiErrorMessage(err: unknown): string | null {
  const e = err as { response?: { data?: { message?: string } } }
  const m = e.response?.data?.message
  return typeof m === 'string' && m.length > 0 ? m : null
}
