import { parseEntryNumber } from '@/shared/audition/entryNumbers'
import { apiClient } from '../client'
import { unwrapData } from '../unwrap'
import type { PublicVotesPagePayload } from './types'
import { parsePublicVoteItem } from './parsers'
import { isAllCategoryName } from '@/shared/audition/allCategorySentinel'
import { parseVoteStatus } from '@/shared/audition/votingRounds'

/** 공개 투표 목록 (비로그인 조회 가능) */
export const listAuditionVotes = async (
  auditionId: string,
  category?: string | null,
  share?: { round?: number | null; candidate?: string | null; locale?: string }
): Promise<PublicVotesPagePayload> => {
  const params: Record<string, string> = {}
  if (category && !isAllCategoryName(category)) params.category = category
  if (share?.round) params.round = String(share.round)
  if (share?.candidate) params.candidate = share.candidate
  if (share?.locale) params.locale = share.locale
  const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/votes`, { params })
  const body = unwrapData<Record<string, unknown>>(data)
  const auditionRaw = (body.audition ?? {}) as Record<string, unknown>
  const summaryRaw = (body.summary ?? {}) as Record<string, unknown>
  const itemsRaw = Array.isArray(body.items) ? body.items : []
  const catRaw = Array.isArray(auditionRaw.categories) ? auditionRaw.categories : []
  return {
    votingEnabled: body.votingEnabled !== false,
    votingPlanEnabled: body.votingPlanEnabled !== false,
    roundNumber: Number(body.roundNumber ?? 1) || 1,
    voteStatus: parseVoteStatus(body.voteStatus),
    voteStartAt: body.voteStartAt != null ? String(body.voteStartAt) : null,
    voteEndAt: body.voteEndAt != null ? String(body.voteEndAt) : null,
    voteRoundNumber: body.voteRoundNumber != null ? Number(body.voteRoundNumber) : null,
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
    sharedCandidate:
      body.sharedCandidate && typeof body.sharedCandidate === 'object'
        ? parsePublicVoteItem(body.sharedCandidate as Record<string, unknown>)
        : null,
    items: itemsRaw.map((x) => parsePublicVoteItem(x as Record<string, unknown>)),
  }
}

export type MyVoteSharePayload = {
  candidateNumber?: number
  candidate: boolean
  auditionId: string | null
  auditionTitle: string | null
  applicationId: string | null
  roundNumber: number | null
  voteStatus?: 'NOT_STARTED' | 'SCHEDULED' | 'OPEN' | 'CLOSED'
  voteStartAt: string | null
  voteEndAt: string | null
}

/** 지원자 본인: 확정 후보일 때만 공유 링크 정보를 준다. */
export const getMyVoteShare = async (applicationId: string): Promise<MyVoteSharePayload> => {
  const { data } = await apiClient.get<unknown>(`/me/applications/${applicationId}/vote-share`)
  const b = unwrapData<Record<string, unknown>>(data) ?? {}
  const s = (k: string) => (b[k] != null ? String(b[k]) : null)
  return {
    candidateNumber: parseEntryNumber(b.candidateNumber),
    candidate: b.candidate === true,
    auditionId: s('auditionId'),
    auditionTitle: s('auditionTitle'),
    applicationId: s('applicationId'),
    roundNumber: b.roundNumber != null ? Number(b.roundNumber) : null,
    voteStatus: parseVoteStatus(b.voteStatus),
    voteStartAt: s('voteStartAt'),
    voteEndAt: s('voteEndAt'),
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

export type VoteSchedulePayload = {
  voteStatus: string
  roundNumber: number
  voteStartAt: string | null
  voteEndAt: string | null
  voteStartedAt: string | null
  candidateCount: number
  candidateApplicationIds: string[]
}

export const getVoteSchedule = async (auditionId: string): Promise<VoteSchedulePayload> => {
  const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/votes/schedule`)
  const body = unwrapData<Record<string, unknown>>(data)
  const ids = Array.isArray(body.candidateApplicationIds) ? body.candidateApplicationIds : []
  return {
    voteStatus: String(body.voteStatus ?? 'NOT_STARTED'),
    roundNumber: Number(body.roundNumber ?? 1) || 1,
    voteStartAt: body.voteStartAt != null ? String(body.voteStartAt) : null,
    voteEndAt: body.voteEndAt != null ? String(body.voteEndAt) : null,
    voteStartedAt: body.voteStartedAt != null ? String(body.voteStartedAt) : null,
    candidateCount: Number(body.candidateCount ?? 0) || 0,
    candidateApplicationIds: ids.map((x) => String(x)),
  }
}

export const startAuditionVote = async (
  auditionId: string,
  body: { startAt: string; endAt: string; applicationIds?: string[] },
): Promise<VoteSchedulePayload> => {
  const { data } = await apiClient.post<unknown>(`/auditions/${auditionId}/votes/start`, body)
  const row = unwrapData<Record<string, unknown>>(data)
  const ids = Array.isArray(row.candidateApplicationIds) ? row.candidateApplicationIds : []
  return {
    voteStatus: String(row.voteStatus ?? 'NOT_STARTED'),
    roundNumber: Number(row.roundNumber ?? 1) || 1,
    voteStartAt: row.voteStartAt != null ? String(row.voteStartAt) : null,
    voteEndAt: row.voteEndAt != null ? String(row.voteEndAt) : null,
    voteStartedAt: row.voteStartedAt != null ? String(row.voteStartedAt) : null,
    candidateCount: Number(row.candidateCount ?? 0) || 0,
    candidateApplicationIds: ids.map((x) => String(x)),
  }
}
