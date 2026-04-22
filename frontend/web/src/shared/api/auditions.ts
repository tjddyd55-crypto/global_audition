import { apiClient } from './client'
import type { AuditionDto, AuditionImages, CreateAuditionPayload } from '../types/audition'
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

/** 기획사 보드 API 상태 (백엔드 agencyBoardStatusToApi) */
export type AgencyBoardStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'

export type ManageApplicantItem = {
  applicationId: string
  userName: string
  name: string
  userEmail: string
  videoUrl: string
  thumbnailUrl: string | null
  category: string
  viewCount: number
  likeCount: number
  voteCount: number
  age: number | null
  nationality: string | null
  snsCount: number
  /** 지원서 현재 차수 (1=1차) */
  round: number
  createdAt: string | null
  recommendedScore?: number | null
  recommendedRank?: number | null
  rank?: number | null
  recommended?: boolean | null
  isVoted?: boolean
  status: AgencyBoardStatus
}

export type ManageListFilters = {
  category?: string | null
  minAge?: number | null
  maxAge?: number | null
  nationality?: string | null
  hasSns?: boolean | null
  status?: AgencyBoardStatus | '' | null
  /** 특정 차수만 (미전달 시 전체) */
  round?: number | null
}

export type ApplicationAgencyDetail = {
  id: string
  auditionId: string
  name: string
  birthDate: string | null
  age: number | null
  nationality: string | null
  videoUrl: string
  thumbnailUrl: string | null
  introText: string | null
  status: AgencyBoardStatus
  round: number
  createdAt: string | null
  snsLinks: Array<{ platform: string; url: string }>
}

export type ManageRoundCount = { round: number; count: number }

export type ManageAuditionHeader = {
  id: string
  title: string
  description: string
  processMode: string
  maxRoundNumber: number | null
}

export type ManageApplicationsPayload = {
  audition: ManageAuditionHeader
  stats: ManageApplicationStats
  categories: VotePageCategory[]
  items: ManageApplicantItem[]
  applicantTotalCount: number
  maxRound: number
  roundCounts: ManageRoundCount[]
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

function parseAuditionImages(raw: Record<string, unknown>): AuditionImages {
  const nest = raw.images
  if (nest && typeof nest === 'object' && !Array.isArray(nest)) {
    const n = nest as Record<string, unknown>
    const o = n.original != null ? String(n.original).trim() : ''
    const m = n.medium != null ? String(n.medium).trim() : ''
    const t = n.thumb != null ? String(n.thumb).trim() : ''
    if (o || m || t) {
      const base = o || m || t
      return {
        original: (o || base) || null,
        medium: (m || base) || null,
        thumb: (t || base) || null,
      }
    }
  }
  const legacy =
    (raw.coverImage != null && String(raw.coverImage).trim()) ||
    (raw.cover_image != null && String(raw.cover_image).trim()) ||
    (raw.imageUrl != null && String(raw.imageUrl).trim()) ||
    ''
  if (legacy) {
    return { original: legacy, medium: legacy, thumb: legacy }
  }
  return { original: null, medium: null, thumb: null }
}

export function parseAuditionDto(raw: Record<string, unknown>): AuditionDto {
  const tagRefsRaw = raw.tagRefs
  const tagRefs = Array.isArray(tagRefsRaw)
    ? (tagRefsRaw as Record<string, unknown>[]).map((row) => {
        const tid = row.tagId != null ? String(row.tagId) : ''
        return {
          tagId: tid.length > 0 ? tid : null,
          name: String(row.name ?? '').trim(),
        }
      }).filter((r) => r.name.length > 0)
    : undefined

  return {
    id: String(raw.id ?? ''),
    ownerId: String(raw.ownerId ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    status: String(raw.status ?? 'DRAFT'),
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : undefined,
    countryCode: raw.countryCode != null ? String(raw.countryCode) : null,
    deadlineAt: raw.deadlineAt != null ? String(raw.deadlineAt) : null,
    tags: safeStringArr(raw.tags),
    tagRefs: tagRefs && tagRefs.length > 0 ? tagRefs : undefined,
    createdAt: String(raw.createdAt ?? ''),
    images: parseAuditionImages(raw),
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
    hasApplied: raw.hasApplied === true ? true : raw.hasApplied === false ? false : undefined,
    processMode: raw.processMode != null ? String(raw.processMode) : 'SINGLE',
    myApplicationId:
      raw.myApplicationId != null && String(raw.myApplicationId).length > 0
        ? String(raw.myApplicationId)
        : null,
    myCurrentRoundNumber:
      raw.myCurrentRoundNumber != null && Number.isFinite(Number(raw.myCurrentRoundNumber))
        ? Number(raw.myCurrentRoundNumber)
        : null,
    roundSummaries: Array.isArray(raw.roundSummaries)
      ? (raw.roundSummaries as Record<string, unknown>[]).map((row) => ({
          roundId: String(row.roundId ?? ''),
          roundNumber: Number(row.roundNumber ?? 0) || 0,
        }))
      : [],
    groupId: raw.groupId != null && String(raw.groupId).length > 0 ? String(raw.groupId) : undefined,
    round:
      raw.round != null && Number.isFinite(Number(raw.round))
        ? Number(raw.round)
        : raw.seriesRound != null && Number.isFinite(Number(raw.seriesRound))
          ? Number(raw.seriesRound)
          : 1,
    displayTitle: raw.displayTitle != null ? String(raw.displayTitle).trim() || undefined : undefined,
    recruitmentRoundLabel:
      raw.recruitmentRoundLabel != null ? String(raw.recruitmentRoundLabel).trim() || undefined : undefined,
    canApply: raw.canApply === true ? true : raw.canApply === false ? false : undefined,
    applyBlockedMessage:
      raw.applyBlockedMessage != null ? String(raw.applyBlockedMessage) : undefined,
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

  /** 기획사·관리자: 동일 시리즈 다음 차 공고 생성(DRAFT) */
  createNextSeriesRound: async (id: string): Promise<AuditionDto> => {
    const { data } = await apiClient.post<Record<string, unknown>>(`/auditions/${id}/series/next-round`)
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

  /** 투표 카드 영상 재생 시 대표 영상 조회수 +1 (세션당 1회 제한은 프론트에서 처리) */
  bumpApplicationView: async (applicationId: string): Promise<void> => {
    const { data } = await apiClient.post<unknown>(`/applications/${applicationId}/view`)
    unwrapData<boolean>(data)
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

/** 스펙 문서용 별칭 — {@link auditionApi.listManageApplications} 와 동일 */
export function getManageList(auditionId: string, filters?: ManageListFilters | string | null) {
  return auditionApi.listManageApplications(auditionId, filters)
}
