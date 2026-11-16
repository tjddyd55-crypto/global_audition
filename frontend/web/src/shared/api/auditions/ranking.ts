import { apiClient } from '../client'
import { unwrapData } from '../unwrap'
import type { RankingItem } from './types'

export type RankingPage = {
  /** 현재 회차 투표(랭킹) 사용 여부. false 면 비활성 안내 */
  votingEnabled: boolean
  /** 랭킹 기준 회차 */
  roundNumber: number
  /** 공고 소유 기획사·관리자 응답(점수·추천 등 추가 필드) */
  manageView: boolean
  items: RankingItem[]
}

/** 랭킹 응답 파싱(공개 응답은 category·status·score 등이 없다). */
export function parseRankingPage(raw: unknown): RankingPage {
  const body = (raw ?? {}) as { items?: unknown[]; votingEnabled?: boolean; roundNumber?: unknown; manageView?: boolean }
  const items = (Array.isArray(body.items) ? body.items : []).map((x): RankingItem => {
    const r = (x ?? {}) as Record<string, unknown>
    const scoreVal = Number(r.score ?? r.recommendedScore ?? 0) || 0
    const avatar = typeof r.avatarUrl === 'string' && r.avatarUrl.trim() ? r.avatarUrl.trim() : null
    return {
      applicationId: String(r.applicationId ?? ''),
      userName: String(r.userName ?? ''),
      avatarUrl: avatar,
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
  return {
    votingEnabled: body.votingEnabled !== false,
    roundNumber: Number(body.roundNumber ?? 1) || 1,
    manageView: body.manageView === true,
    items,
  }
}

export const getAuditionRanking = async (auditionId: string): Promise<RankingPage> => {
  const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/ranking`)
  return parseRankingPage(unwrapData<unknown>(data))
}
