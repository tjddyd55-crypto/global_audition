import { apiClient } from '../client'
import { unwrapData } from '../unwrap'
import type { RankingItem } from './types'

export const getAuditionRanking = async (auditionId: string): Promise<RankingItem[]> => {
  const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/ranking`)
  const body = unwrapData<{ items: unknown[] }>(data)
  return (body.items ?? []).map((x) => {
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
}
