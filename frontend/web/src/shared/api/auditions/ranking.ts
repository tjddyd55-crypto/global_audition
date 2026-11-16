import { apiClient } from '../client'
import { unwrapData } from '../unwrap'
import type { RankingItem } from './types'

export type RankingPage = {
  /** 현재 회차 투표(랭킹) 사용 여부. false 면 비활성 안내 */
  votingEnabled: boolean
  items: RankingItem[]
}

export const getAuditionRanking = async (auditionId: string): Promise<RankingPage> => {
  const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/ranking`)
  const body = unwrapData<{ items: unknown[]; votingEnabled?: boolean }>(data)
  const items = (body.items ?? []).map((x): RankingItem => {
    const r = x as Record<string, unknown>
    const scoreVal = Number(r.score ?? r.recommendedScore ?? 0) || 0
    return {
      applicationId: String(r.applicationId ?? ''),
      userName: String(r.userName ?? ''),
      category: String(r.category ?? ''),
      voteCount: Number(r.voteCount ?? 0) || 0,
      viewCount: Number(r.viewCount ?? 0) || 0,
      status: String(r.status ?? ''),
      score: scoreVal,
      recommendedScore: scoreVal,
      rank: Number(r.rank ?? 0) || 0,
      recommended: Boolean(r.recommended),
      isVoted: Boolean(r.isVoted),
    }
  })
  return { votingEnabled: body.votingEnabled !== false, items }
}
