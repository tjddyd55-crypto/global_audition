import { apiClient } from '../client'
import { unwrapData } from '../unwrap'
import type { PublicVotesPagePayload } from './types'
import { parsePublicVoteItem } from './parsers'

/** 공개 투표 목록 (비로그인 조회 가능) */
export const listAuditionVotes = async (
  auditionId: string,
  category?: string | null
): Promise<PublicVotesPagePayload> => {
  const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/votes`, {
    params: category && category !== '전체' ? { category } : {},
  })
  const body = unwrapData<Record<string, unknown>>(data)
  const auditionRaw = (body.audition ?? {}) as Record<string, unknown>
  const summaryRaw = (body.summary ?? {}) as Record<string, unknown>
  const itemsRaw = Array.isArray(body.items) ? body.items : []
  const catRaw = Array.isArray(auditionRaw.categories) ? auditionRaw.categories : []
  return {
    audition: {
      id: String(auditionRaw.id ?? ''),
      title: String(auditionRaw.title ?? ''),
      description: String(auditionRaw.description ?? ''),
      applicantCount: Number(auditionRaw.applicantCount ?? 0) || 0,
      totalVotes: Number(auditionRaw.totalVotes ?? 0) || 0,
      categories: catRaw.map((c) => {
        const x = c as Record<string, unknown>
        return { name: String(x.name ?? ''), count: Number(x.count ?? 0) || 0 }
      }),
    },
    summary: {
      applicantCount: Number(summaryRaw.applicantCount ?? 0) || 0,
      totalVotes: Number(summaryRaw.totalVotes ?? 0) || 0,
      totalViewCount: Number(summaryRaw.totalViewCount ?? 0) || 0,
      myVoteCount: Number(summaryRaw.myVoteCount ?? 0) || 0,
    },
    myVoteApplicationId:
      body.myVoteApplicationId != null && String(body.myVoteApplicationId).length > 0
        ? String(body.myVoteApplicationId)
        : null,
    items: itemsRaw.map((x) => parsePublicVoteItem(x as Record<string, unknown>)),
  }
}

export const voteAudition = async (
  auditionId: string,
  applicationId: string
): Promise<{ applicationId: string; replaced: boolean }> => {
  const { data } = await apiClient.post<unknown>('/votes', { auditionId, applicationId })
  return unwrapData<{ applicationId: string; replaced: boolean }>(data)
}

export const cancelAuditionVote = async (applicationId: string): Promise<void> => {
  const { data } = await apiClient.delete<unknown>(`/votes/${applicationId}`)
  unwrapData<boolean>(data)
}

/** 투표 카드 영상 재생 시 대표 영상 조회수 +1 (세션당 1회 제한은 프론트에서 처리) */
export const bumpAuditionApplicationView = async (applicationId: string): Promise<void> => {
  const { data } = await apiClient.post<unknown>(`/applications/${applicationId}/view`)
  unwrapData<boolean>(data)
}
