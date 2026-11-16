import { isAxiosError } from 'axios'

/**
 * GET /auditions/{id}/ranking 은 공고 소유 기획사·관리자 전용.
 * 401(비로그인)·403(지원자/타 기획사)은 오류가 아니라 "기획사·관리자만 볼 수 있음" 안내로 보여 준다.
 */
export function isRankingAccessDenied(error: unknown): boolean {
  if (!isAxiosError(error)) return false
  const status = error.response?.status
  return status === 401 || status === 403
}
