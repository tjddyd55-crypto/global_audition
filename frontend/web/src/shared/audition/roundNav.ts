export type AuditionRoundSummary = { roundId: string; roundNumber: number }

/**
 * 현재 신청자 라운드 번호에 해당하는 roundId를 찾는다.
 * 회차 목록이 비어 있는 공고(단일 전형 등)는 정상 경로이므로 로그를 남기지 않는다.
 * 목록은 있는데 대상 회차가 없을 때만 호출을 막고 오류를 남긴다.
 */
export function roundIdForRoundNumber(
  roundSummaries: AuditionRoundSummary[],
  target: number
): string | null {
  const row = roundSummaries.find((r) => r.roundNumber === target)
  const roundId = row?.roundId?.trim()
  if (!roundId) {
    if (roundSummaries.length > 0) {
      console.error('roundId not found', { roundSummaries, target })
    }
    return null
  }
  return roundId
}
