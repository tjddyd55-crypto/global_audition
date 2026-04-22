export type AuditionRoundSummary = { roundId: string; roundNumber: number }

/**
 * 현재 신청자 라운드 번호에 해당하는 roundId를 찾는다.
 * 누락·불일치 시 API 호출을 막기 위해 null을 반환하고 로그를 남긴다.
 */
export function roundIdForRoundNumber(
  roundSummaries: AuditionRoundSummary[],
  target: number
): string | null {
  const row = roundSummaries.find((r) => r.roundNumber === target)
  const roundId = row?.roundId?.trim()
  if (!roundId) {
    console.error('roundId not found', { roundSummaries, target })
    return null
  }
  return roundId
}
