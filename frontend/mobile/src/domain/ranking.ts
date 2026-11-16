/**
 * 랭킹 API(GET /auditions/{id}/ranking)는 백엔드 정책상 해당 공고의 기획사(소유자)·관리자만 조회할 수 있다.
 * 지원자·비로그인 사용자는 401/403 을 받으므로 "불러오지 못함" 오류가 아니라 안내(restricted)로 보여 준다.
 */
export type RankingViewState = 'loading' | 'restricted' | 'error' | 'empty' | 'list'

export function rankingViewState(input: { isLoading: boolean; error: unknown; count: number }): RankingViewState {
  if (input.isLoading) return 'loading'
  if (input.error) return isRankingAccessDenied(input.error) ? 'restricted' : 'error'
  return input.count > 0 ? 'list' : 'empty'
}

export function isRankingAccessDenied(error: unknown): boolean {
  // ApiError(status) — http 모듈(expo 의존)을 끌어오지 않도록 status 만 본다.
  const status = (error as { status?: unknown } | null)?.status
  return status === 401 || status === 403
}

/** 랭킹 진입 버튼은 공고 소유 기획사에게만 노출(앱에는 관리자 역할이 없다). */
export function canViewRanking(
  session: { role?: string | null; userId?: string | null } | null | undefined,
  ownerId: string | null | undefined,
): boolean {
  if (!session || session.role !== 'AGENCY') return false
  const owner = ownerId?.trim()
  return Boolean(owner) && session.userId === owner
}
