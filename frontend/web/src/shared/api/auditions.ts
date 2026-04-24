import { apiClient } from './client'
import type { AuditionDto, CreateAuditionPayload } from '../types/audition'
import { unwrapData } from './unwrap'
import { parseAuditionDto } from './auditions/parsers'
import { listOpenAuditions, getAuditionById } from './auditions/public'
import {
  listAuditionVotes,
  voteAudition,
  cancelAuditionVote,
  bumpAuditionApplicationView,
} from './auditions/votes'
import { getAuditionRanking } from './auditions/ranking'
import { createNextSeriesRoundAudition } from './auditions/series'
import type {
  VotePageCategory,
  PublicVoteItem,
  PublicVotesPagePayload,
  ManageApplicationStats,
  AgencyBoardStatus,
  ManageApplicantItem,
  ManageListFilters,
  ApplicationAgencyDetail,
  ManageRoundCount,
  ManageAuditionHeader,
  ManageApplicationsPayload,
  RankingItem,
} from './auditions/types'

/** @deprecated 레거시 import 호환 — AuditionDto와 동일 */
export type { AuditionDto as AuditionResponse } from '../types/audition'
export type {
  VotePageCategory,
  PublicVoteItem,
  PublicVotesPagePayload,
  ManageApplicationStats,
  AgencyBoardStatus,
  ManageApplicantItem,
  ManageListFilters,
  ApplicationAgencyDetail,
  ManageRoundCount,
  ManageAuditionHeader,
  ManageApplicationsPayload,
  RankingItem,
} from './auditions/types'
export { parseAuditionDto }

export const auditionApi = {
  listOpen: async (): Promise<AuditionDto[]> => {
    return listOpenAuditions()
  },

  getById: async (id: string): Promise<AuditionDto> => {
    return getAuditionById(id)
  },

  create: async (body: CreateAuditionPayload): Promise<AuditionDto> => {
    const { data } = await apiClient.post<Record<string, unknown>>('/auditions', body)
    return parseAuditionDto(data ?? {})
  },

  /** 기획사·관리자: 동일 시리즈 다음 차 공고 생성(DRAFT) */
  createNextSeriesRound: async (id: string): Promise<AuditionDto> => {
    return createNextSeriesRoundAudition(id)
  },

  getMyAuditions: async (_params: { page?: number; size?: number } = {}): Promise<{ content: AuditionDto[]; totalPages: number }> => {
    const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions/my')
    const content = (data ?? []).map((row) => parseAuditionDto(row))
    return { content, totalPages: Math.max(1, Math.ceil(content.length / 20)) }
  },

  update: async (
    id: string,
    body: Partial<CreateAuditionPayload> & Record<string, unknown>
  ): Promise<AuditionDto> => {
    const { data } = await apiClient.patch<Record<string, unknown>>(`/auditions/${id}`, body)
    return parseAuditionDto(data ?? {})
  },

  deleteAudition: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/auditions/${id}`)
  },

  /** 공개 투표 목록 (비로그인 조회 가능) */
  listVotes: async (auditionId: string, category?: string | null): Promise<PublicVotesPagePayload> => {
    return listAuditionVotes(auditionId, category)
  },

  vote: async (auditionId: string, applicationId: string): Promise<{ applicationId: string; replaced: boolean }> => {
    return voteAudition(auditionId, applicationId)
  },

  cancelVote: async (applicationId: string): Promise<void> => {
    return cancelAuditionVote(applicationId)
  },

  /** 투표 카드 영상 재생 시 대표 영상 조회수 +1 (세션당 1회 제한은 프론트에서 처리) */
  bumpApplicationView: async (applicationId: string): Promise<void> => {
    return bumpAuditionApplicationView(applicationId)
  },

  /** AGENCY/ADMIN: 지원자 관리 화면 */
  listManageApplications: async (
    auditionId: string,
    filters?: ManageListFilters | string | null
  ): Promise<ManageApplicationsPayload> => {
    const f: ManageListFilters =
      typeof filters === 'string' || filters == null
        ? { category: typeof filters === 'string' ? filters : null }
        : filters
    const params: Record<string, string | number | boolean> = {}
    if (f.category && f.category !== '전체') params.category = f.category
    if (f.minAge != null) params.minAge = Number(f.minAge)
    if (f.maxAge != null) params.maxAge = Number(f.maxAge)
    if (f.nationality && f.nationality !== '') params.nationality = f.nationality
    if (f.hasSns === true || f.hasSns === false) params.hasSns = f.hasSns
    const boardSt = f.status
    if (typeof boardSt === 'string' && boardSt.length > 0) {
      params.status = boardSt
    }
    if (f.round != null && f.round >= 1) {
      params.round = f.round
    }
    const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/applications/manage`, {
      params,
    })
    const body = unwrapData<Record<string, unknown>>(data)
    const audition = (body.audition ?? {}) as Record<string, unknown>
    const stats = (body.stats ?? {}) as Record<string, unknown>
    const categories = Array.isArray(body.categories) ? body.categories : []
    const items = Array.isArray(body.items) ? body.items : []
    const roundCountsRaw = Array.isArray(body.roundCounts) ? body.roundCounts : []
    return {
      audition: {
        id: String(audition.id ?? ''),
        title: String(audition.title ?? ''),
        description: audition.description != null ? String(audition.description) : '',
        processMode: audition.processMode != null ? String(audition.processMode) : 'SINGLE',
        maxRoundNumber: (() => {
          const v = audition.maxRoundNumber
          if (v == null || v === '') return null
          const n = Number(v)
          return Number.isNaN(n) ? null : n
        })(),
      },
      stats: {
        total: Number(stats.total ?? 0) || 0,
        submitted: Number(stats.submitted ?? 0) || 0,
        reviewing: Number(stats.reviewing ?? 0) || 0,
        accepted: Number(stats.accepted ?? 0) || 0,
        rejected: Number(stats.rejected ?? 0) || 0,
      },
      categories: categories.map((c) => {
        const x = c as Record<string, unknown>
        return { name: String(x.name ?? ''), count: Number(x.count ?? 0) || 0 }
      }),
      applicantTotalCount: Number(body.applicantTotalCount ?? 0) || 0,
      maxRound: Math.max(1, Number(body.maxRound ?? 1) || 1),
      roundCounts: roundCountsRaw.map((x) => {
        const row = x as Record<string, unknown>
        return {
          round: Number(row.round ?? 1) || 1,
          count: Number(row.count ?? 0) || 0,
        }
      }),
      items: items.map((raw) => {
        const r = raw as Record<string, unknown>
        const name = String(r.name ?? r.userName ?? '')
        const st = String(r.status ?? 'PENDING')
        return {
          applicationId: String(r.applicationId ?? ''),
          userName: String(r.userName ?? ''),
          name,
          userEmail: String(r.userEmail ?? ''),
          videoUrl: String(r.videoUrl ?? ''),
          thumbnailUrl: r.thumbnailUrl != null ? String(r.thumbnailUrl) : null,
          category: String(r.category ?? ''),
          viewCount: Number(r.viewCount ?? 0) || 0,
          likeCount: Number(r.likeCount ?? 0) || 0,
          voteCount: Number(r.voteCount ?? 0) || 0,
          age: r.age != null ? Number(r.age) : null,
          nationality: r.nationality != null ? String(r.nationality) : null,
          snsCount: Number(r.snsCount ?? 0) || 0,
          round: r.round != null ? Number(r.round) : 1,
          createdAt: r.createdAt != null ? String(r.createdAt) : null,
          recommendedScore: r.recommendedScore != null ? Number(r.recommendedScore) : null,
          recommendedRank: r.recommendedRank != null ? Number(r.recommendedRank) : null,
          rank: r.rank != null ? Number(r.rank) : null,
          recommended: r.recommended != null ? Boolean(r.recommended) : null,
          isVoted: r.isVoted != null ? Boolean(r.isVoted) : false,
          status: st as ManageApplicantItem['status'],
        }
      }),
    }
  },

  getApplicationAgencyDetail: async (applicationId: string): Promise<ApplicationAgencyDetail> => {
    const { data } = await apiClient.get<unknown>(`/applications/${applicationId}/agency-detail`)
    const d = unwrapData<Record<string, unknown>>(data)
    const sns = Array.isArray(d.snsLinks) ? d.snsLinks : []
    return {
      id: String(d.id ?? ''),
      auditionId: String(d.auditionId ?? ''),
      name: String(d.name ?? ''),
      birthDate: d.birthDate != null ? String(d.birthDate) : null,
      age: d.age != null ? Number(d.age) : null,
      nationality: d.nationality != null ? String(d.nationality) : null,
      videoUrl: String(d.videoUrl ?? ''),
      thumbnailUrl: d.thumbnailUrl != null ? String(d.thumbnailUrl) : null,
      introText: d.introText != null ? String(d.introText) : null,
      status: String(d.status ?? 'PENDING') as AgencyBoardStatus,
      round: d.round != null ? Number(d.round) : 1,
      createdAt: d.createdAt != null ? String(d.createdAt) : null,
      snsLinks: sns.map((x) => {
        const s = x as Record<string, unknown>
        return { platform: String(s.platform ?? ''), url: String(s.url ?? '') }
      }),
    }
  },

  updateApplicationStatus: async (
    applicationId: string,
    status: AgencyBoardStatus | 'ACCEPTED'
  ): Promise<{ applicationId: string; status: string }> => {
    const { data } = await apiClient.patch<unknown>(`/applications/${applicationId}/status`, { status })
    return unwrapData<{ applicationId: string; status: string }>(data)
  },

  getRanking: async (auditionId: string): Promise<RankingItem[]> => {
    return getAuditionRanking(auditionId)
  },
}

/** 스펙 문서용 별칭 — {@link auditionApi.listManageApplications} 와 동일 */
export function getManageList(auditionId: string, filters?: ManageListFilters | string | null) {
  return auditionApi.listManageApplications(auditionId, filters)
}
