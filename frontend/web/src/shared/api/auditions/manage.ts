import { apiClient } from '../client'
import { unwrapData } from '../unwrap'
import type { AuditionDto, CreateAuditionPayload } from '@/shared/types/audition'
import { parseAuditionDto } from './parsers'
import type {
  AgencyBoardStatus,
  ApplicationAgencyDetail,
  ManageApplicantItem,
  ManageApplicationsPayload,
  ManageListFilters,
} from './types'

export const createAudition = async (body: CreateAuditionPayload): Promise<AuditionDto> => {
  const { data } = await apiClient.post<Record<string, unknown>>('/auditions', body)
  return parseAuditionDto(data ?? {})
}

export const getMyAuditions = async (
  _params: { page?: number; size?: number } = {}
): Promise<{ content: AuditionDto[]; totalPages: number }> => {
  const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions/my')
  const content = (data ?? []).map((row) => parseAuditionDto(row))
  return { content, totalPages: Math.max(1, Math.ceil(content.length / 20)) }
}

export const updateAudition = async (
  id: string,
  body: Partial<CreateAuditionPayload> & Record<string, unknown>
): Promise<AuditionDto> => {
  const { data } = await apiClient.patch<Record<string, unknown>>(`/auditions/${id}`, body)
  return parseAuditionDto(data ?? {})
}

export const deleteAudition = async (id: string | number): Promise<void> => {
  await apiClient.delete(`/auditions/${id}`)
}

/** AGENCY/ADMIN: 지원자 관리 화면 */
export const listManageApplications = async (
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
}

export const getApplicationAgencyDetail = async (applicationId: string): Promise<ApplicationAgencyDetail> => {
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
}

export const updateApplicationStatus = async (
  applicationId: string,
  status: AgencyBoardStatus | 'ACCEPTED'
): Promise<{ applicationId: string; status: string }> => {
  const { data } = await apiClient.patch<unknown>(`/applications/${applicationId}/status`, { status })
  return unwrapData<{ applicationId: string; status: string }>(data)
}

export const manageAuditionApi = {
  createAudition,
  updateAudition,
  deleteAudition,
  getMyAuditions,
  listManageApplications,
  getApplicationAgencyDetail,
  updateApplicationStatus,
}
