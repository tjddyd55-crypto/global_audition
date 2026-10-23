/** 백엔드 AuditionSeriesPresentation.APPLY_BLOCKED_PREV_ROUND_NOT_ACCEPTED_CODE 와 동일. */
export const PREV_ROUND_APPLY_BLOCKED_CODE = 'PREV_ROUND_NOT_ACCEPTED'

/**
 * 지원 불가 문구는 API message가 아니라 코드로 고른다.
 * 코드가 없으면 이전 라운드 제한이 현재 유일한 차단 사유라 그 카탈로그를 쓴다.
 * 알 수 없는 코드는 원문 대신 일반 실패 문구를 쓴다.
 */
export function applyBlockedDisplayMessage(
  applyBlockedCode: string | null | undefined,
  prevRoundText: string,
  genericText: string,
): string {
  if (applyBlockedCode == null || applyBlockedCode === '' || applyBlockedCode === PREV_ROUND_APPLY_BLOCKED_CODE) {
    return prevRoundText
  }
  return genericText
}
