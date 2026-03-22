import { apiClient } from './client'
import type { AuditionDto, CreateAuditionPayload } from '../types/audition'
import { safeStringArr } from '../utils/safe'
import { unwrapData } from './unwrap'

/** @deprecated 레거시 import 호환 — AuditionDto와 동일 */
export type { AuditionDto as AuditionResponse } from '../types/audition'

/**
 * SSOT: 백엔드 AuditionResponse 배열은 항상 [] 보장. 그래도 방어적으로 safeStringArr만 사용.
 */
/** GET /auditions/:id/votes */
export type VotePageCategory = { name: string; count: number }

export type PublicVoteItem = {
  applicationId: string
  userName: string
  userEmail: string
  description: string
  videoUrl: string
  thumbnailUrl: string | null
  category: string
  voteCount: number
  viewCount: number
  isVoted: boolean
  rank: number
  status?: string
  recommendedScore?: number | null
  recommendedRank?: number | null
  recommended?: boolean | null
}

export type PublicVotesPagePayload = {
  audition: {
    id: string
    title: string
    description: string
    applicantCount: number
    totalVotes: number
    categories: VotePageCategory[]
  }
  summary: {
    applicantCount: number
    totalVotes: number
    totalViewCount: number
    myVoteCount: number
  }
  myVoteApplicationId: string | null
  items: PublicVoteItem[]
}

export type ManageApplicationStats = {
  total: number
  submitted: number
  reviewing: number
  accepted: number
  rejected: number
}

export type ManageApplicantItem = {
  applicationId: string
  userName: string
  userEmail: string
  videoUrl: string
  thumbnailUrl: string | null
  category: string
  viewCount: number
  likeCount: number
  voteCount: number
  recommendedScore?: number | null
  recommendedRank?: number | null
  rank?: number | null
  recommended?: boolean | null
  isVoted?: boolean
  status: 'SUBMITTED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED'
}

export type ManageApplicationsPayload = {
  audition: { id: string; title: string }
  stats: ManageApplicationStats
  categories: VotePageCategory[]
  items: ManageApplicantItem[]
}

export type RankingItem = {
  applicationId: string
  userName: string
  category: string
  voteCount: number
  viewCount: number
  status: string
  score: number
  recommendedScore: number
  rank: number
  recommended: boolean
  isVoted: boolean
}

function parsePublicVoteItem(raw: Record<string, unknown>): PublicVoteItem {
  const recScore = raw.recommendedScore
  const recRank = raw.recommendedRank
  return {
    applicationId: String(raw.applicationId ?? ''),
    userName: String(raw.userName ?? ''),
    userEmail: String(raw.userEmail ?? ''),
    description: String(raw.description ?? ''),
    videoUrl: String(raw.videoUrl ?? ''),
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    category: String(raw.category ?? ''),
    voteCount: Number(raw.voteCount ?? 0) || 0,
    viewCount: Number(raw.viewCount ?? 0) || 0,
    isVoted: Boolean(raw.isVoted),
    rank: Number(raw.rank ?? 0) || 0,
    status: raw.status != null ? String(raw.status) : undefined,
    recommendedScore: recScore != null ? Number(recScore) : undefined,
    recommendedRank: recRank != null ? Number(recRank) : undefined,
    recommended: raw.recommended != null ? Boolean(raw.recommended) : undefined,
  }
}

export function parseAuditionDto(raw: Record<string, unknown>): AuditionDto {
  return {
    id: String(raw.id ?? ''),
    ownerId: String(raw.ownerId ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    status: String(raw.status ?? 'DRAFT'),
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : undefined,
    countryCode: raw.countryCode != null ? String(raw.countryCode) : null,
    deadlineAt: raw.deadlineAt != null ? String(raw.deadlineAt) : null,
    category: String(raw.category ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    coverImage: raw.coverImage != null ? String(raw.coverImage) : null,
    videoUrl: raw.videoUrl != null ? String(raw.videoUrl) : null,
    galleryImages: safeStringArr(raw.galleryImages),
    agencyName: String(raw.agencyName ?? ''),
    agencyLogo: raw.agencyLogo != null ? String(raw.agencyLogo) : null,
    applicantsCount: Number(raw.applicantsCount ?? 0) || 0,
    remainingDays: Number(raw.remainingDays ?? 0) || 0,
    recruitFields: safeStringArr(raw.recruitFields),
    qualifications: safeStringArr(raw.qualifications),
    schedules: safeStringArr(raw.schedules),
    location: String(raw.location ?? ''),
    startDate: String(raw.startDate ?? ''),
    endDate: String(raw.endDate ?? ''),
    benefits: safeStringArr(raw.benefits),
  }
}

export const auditionApi = {
  listOpen: async (): Promise<AuditionDto[]> => {
    const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions', { params: { status: 'OPEN' } })
    return (data ?? []).map((row) => parseAuditionDto(row))
  },

  getById: async (id: string): Promise<AuditionDto> => {
    const { data } = await apiClient.get<Record<string, unknown>>(`/auditions/${id}`)
    return parseAuditionDto(data ?? {})
  },

  create: async (body: CreateAuditionPayload): Promise<AuditionDto> => {
    const { data } = await apiClient.post<Record<string, unknown>>('/auditions', body)
    return parseAuditionDto(data ?? {})
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
  },

  vote: async (auditionId: string, applicationId: string): Promise<{ applicationId: string; replaced: boolean }> => {
    const { data } = await apiClient.post<unknown>('/votes', { auditionId, applicationId })
    return unwrapData<{ applicationId: string; replaced: boolean }>(data)
  },

  cancelVote: async (applicationId: string): Promise<void> => {
    const { data } = await apiClient.delete<unknown>(`/votes/${applicationId}`)
    unwrapData<boolean>(data)
  },

  /** AGENCY/ADMIN: 지원자 관리 화면 */
  listManageApplications: async (
    auditionId: string,
    category?: string | null
  ): Promise<ManageApplicationsPayload> => {
    const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/applications/manage`, {
      params: category && category !== '전체' ? { category } : {},
    })
    const body = unwrapData<Record<string, unknown>>(data)
    const audition = (body.audition ?? {}) as Record<string, unknown>
    const stats = (body.stats ?? {}) as Record<string, unknown>
    const categories = Array.isArray(body.categories) ? body.categories : []
    const items = Array.isArray(body.items) ? body.items : []
    return {
      audition: { id: String(audition.id ?? ''), title: String(audition.title ?? '') },
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
      items: items.map((raw) => {
        const r = raw as Record<string, unknown>
        return {
          applicationId: String(r.applicationId ?? ''),
          userName: String(r.userName ?? ''),
          userEmail: String(r.userEmail ?? ''),
          videoUrl: String(r.videoUrl ?? ''),
          thumbnailUrl: r.thumbnailUrl != null ? String(r.thumbnailUrl) : null,
          category: String(r.category ?? ''),
          viewCount: Number(r.viewCount ?? 0) || 0,
          likeCount: Number(r.likeCount ?? 0) || 0,
          voteCount: Number(r.voteCount ?? 0) || 0,
          recommendedScore: r.recommendedScore != null ? Number(r.recommendedScore) : null,
          recommendedRank: r.recommendedRank != null ? Number(r.recommendedRank) : null,
          rank: r.rank != null ? Number(r.rank) : null,
          recommended: r.recommended != null ? Boolean(r.recommended) : null,
          isVoted: r.isVoted != null ? Boolean(r.isVoted) : false,
          status: String(r.status ?? 'SUBMITTED') as ManageApplicantItem['status'],
        }
      }),
    }
  },

  updateApplicationStatus: async (
    applicationId: string,
    status: 'REVIEWING' | 'ACCEPTED' | 'REJECTED'
  ): Promise<{ applicationId: string; status: string }> => {
    const { data } = await apiClient.patch<unknown>(`/applications/${applicationId}/status`, { status })
    return unwrapData<{ applicationId: string; status: string }>(data)
  },

  getRanking: async (auditionId: string): Promise<RankingItem[]> => {
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
  },
}
