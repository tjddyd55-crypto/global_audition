/**
 * 랭킹 API(GET /auditions/{id}/ranking): 투표를 켠 회차는 누구나(비로그인 포함) 볼 수 있고 공개 필드만 온다.
 * 투표 없는 회차는 votingEnabled=false(비활성 안내). 401/403 은 이제 정상 흐름에서 오지 않지만 안내로 처리한다.
 */
export type RankingViewState = 'loading' | 'restricted' | 'error' | 'disabled' | 'empty' | 'list'

export function rankingViewState(input: {
  isLoading: boolean
  error: unknown
  count: number
  /** 공고 투표 설정상 이 회차 랭킹 사용 여부(없으면 true) */
  votingEnabled?: boolean
}): RankingViewState {
  if (input.isLoading) return 'loading'
  if (input.error) return isRankingAccessDenied(input.error) ? 'restricted' : 'error'
  if (input.votingEnabled === false) return 'disabled'
  return input.count > 0 ? 'list' : 'empty'
}

export function isRankingAccessDenied(error: unknown): boolean {
  // ApiError(status) — http 모듈(expo 의존)을 끌어오지 않도록 status 만 본다.
  const status = (error as { status?: unknown } | null)?.status
  return status === 401 || status === 403
}

/** 지금 표를 받을 수 있을 때만 투표 보기 버튼(값이 없으면 기존 동작 = 보임). */
export function canShowVoting(
  audition: { votingEnabled?: boolean; voteStatus?: string | null } | null | undefined,
): boolean {
  if (audition?.voteStatus && audition.voteStatus !== 'OPEN') return false
  return audition?.votingEnabled !== false
}

/** 공개 랭킹은 투표가 시작된 뒤(진행 중·종료) 보여 준다. 값이 없으면 기존 동작. */
export function canViewRanking(
  audition: { votingEnabled?: boolean; voteStatus?: string | null } | null | undefined,
): boolean {
  if (audition?.voteStatus === 'OPEN' || audition?.voteStatus === 'CLOSED') return true
  if (audition?.voteStatus === 'SCHEDULED' || audition?.voteStatus === 'NOT_STARTED') return false
  return canShowVoting(audition)
}

/** 공개 프로필 이미지가 RN 에서 그릴 수 있는 형식인지(아니면 이니셜). */
export function rankingAvatar(item: { avatarUrl?: string | null; userName?: string }): { uri: string | null; initial: string } {
  const url = item.avatarUrl?.trim() ?? ''
  const name = item.userName?.trim() || '?'
  return {
    uri: /^https?:\/\//i.test(url) && !/\.svg(\?|#|$)/i.test(url) ? url : null,
    initial: Array.from(name)[0]?.toUpperCase() ?? '?',
  }
}
