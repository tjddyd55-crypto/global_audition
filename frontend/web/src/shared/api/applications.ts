import { apiClient } from './client'
import { unwrapData } from './unwrap'

export interface ApplicationResponse {
  id: string
  auditionId: string
  applicantId: string
  applicantEmail: string | null
  status: 'SUBMITTED' | 'REVIEWING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
  message?: string | null
  updatedAt?: string
  createdAt: string
}

export interface ApplicationResponseWithAudition extends ApplicationResponse {
  auditionTitle?: string
}

export type CreateApplicationPayload = {
  auditionId: string
  /** 비우면 미저장 (영상만 제출 UX) */
  name?: string | null
  birthDate?: string | null
  age?: number | null
  nationality?: string | null
  videoUrl: string
  introText?: string | null
  snsLinks?: Array<{ platform: string; url: string }>
}

export type ApplicationSnsLink = { platform: string; url: string }

export interface ApplicationDetailWithVideos extends ApplicationResponseWithAudition {
  name?: string | null
  birthDate?: string | null
  age?: number | null
  nationality?: string | null
  introText?: string | null
  videoUrl?: string | null
  snsLinks?: ApplicationSnsLink[]
  videos?: Array<{
    id: string
    title: string
    videoUrl: string
    thumbnailUrl?: string | null
    createdAt?: string
  }>
  /** MULTI_ROUND 면 라운드 메타, 아니면 SINGLE */
  processMode?: string
  currentRoundNumber?: number
  roundSummaries?: Array<{ roundId: string; roundNumber: number }>
}

/** 기획사 지원자 관리 카드 (GET /auditions/:id/applications) */
export type AgencyApplicantItem = {
  applicationId: string
  userName: string
  userEmail: string
  videoUrl: string
  thumbnailUrl: string | null
  category: string
  viewCount: number
  likeCount: number
  status: 'SUBMITTED' | 'REVIEWING' | 'ACCEPTED' | 'REJECTED'
}

export type AgencyApplicationStatus = 'REVIEWING' | 'ACCEPTED' | 'REJECTED'

export const applicationApi = {
  listMy: async (): Promise<ApplicationResponseWithAudition[]> => {
    const { data } = await apiClient.get<unknown>('/me/applications')
    const page = unwrapData<{ items: Array<Record<string, unknown>>; total: number }>(data)
    return (page.items ?? []).map((item) => {
      const i = item as {
        applicationId: string
        auditionId: string
        auditionTitle: string
        appliedAt: string
        status: string
      }
      return {
        id: i.applicationId,
        auditionId: i.auditionId,
        applicantId: '',
        applicantEmail: null,
        auditionTitle: i.auditionTitle,
        status: i.status as ApplicationResponse['status'],
        createdAt: typeof i.appliedAt === 'string' ? i.appliedAt : String(i.appliedAt),
      }
    })
  },

  /** @deprecated 레거시 원클릭 지원 — 서버에서 거부됩니다. `applicationApi.submit`을 사용하세요. */
  apply: async (auditionId: string): Promise<ApplicationResponse> => {
    const { data } = await apiClient.post<ApplicationResponse>(`/auditions/${auditionId}/apply`)
    return data
  },

  submit: async (body: CreateApplicationPayload): Promise<ApplicationResponse> => {
    const { data } = await apiClient.post<ApplicationResponse>('/applications', body)
    return data
  },

  /** 기획사/관리자: 오디션별 지원자 카드 목록 */
  listAgencyApplicants: async (auditionId: string): Promise<AgencyApplicantItem[]> => {
    const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/applications`)
    const body = unwrapData<{ items: AgencyApplicantItem[] }>(data)
    return body.items ?? []
  },

  /** @deprecated listAgencyApplicants 사용 */
  listByAudition: async (auditionId: string): Promise<ApplicationResponse[]> => {
    const items = await applicationApi.listAgencyApplicants(auditionId)
    return items.map((i) => ({
      id: i.applicationId,
      auditionId,
      applicantId: '',
      applicantEmail: i.userEmail,
      status: i.status as ApplicationResponse['status'],
      createdAt: new Date().toISOString(),
    }))
  },

  patchApplicationStatus: async (
    applicationId: string,
    status: AgencyApplicationStatus
  ): Promise<{ applicationId: string; status: string }> => {
    const { data } = await apiClient.patch<unknown>(`/applications/${applicationId}/status`, { status })
    return unwrapData<{ applicationId: string; status: string }>(data)
  },

  getById: async (applicationId: string): Promise<ApplicationDetailWithVideos> => {
    const { data } = await apiClient.get<unknown>(`/me/applications/${applicationId}`)
    const d = unwrapData<{
      applicationId: string
      auditionId: string
      auditionTitle: string
      appliedAt: string
      status: string
      name?: string | null
      birthDate?: string | null
      age?: number | null
      nationality?: string | null
      introText?: string | null
      videoUrl?: string | null
      snsLinks?: Array<{ platform: string; url: string }>
      processMode?: string
      currentRoundNumber?: number
      roundSummaries?: Array<{ roundId: string; roundNumber: number }>
      videos: Array<{ videoId: string; title: string; videoUrl: string; thumbnailUrl?: string | null }>
    }>(data)
    return {
      id: d.applicationId,
      auditionId: d.auditionId,
      applicantId: '',
      applicantEmail: null,
      auditionTitle: d.auditionTitle,
      status: d.status as ApplicationResponse['status'],
      createdAt: typeof d.appliedAt === 'string' ? d.appliedAt : String(d.appliedAt),
      name: d.name ?? null,
      birthDate: d.birthDate ?? null,
      age: d.age ?? null,
      nationality: d.nationality ?? null,
      introText: d.introText ?? null,
      videoUrl: d.videoUrl ?? null,
      snsLinks: Array.isArray(d.snsLinks) ? d.snsLinks : [],
      processMode: d.processMode ?? 'SINGLE',
      currentRoundNumber: d.currentRoundNumber ?? 1,
      roundSummaries: Array.isArray(d.roundSummaries) ? d.roundSummaries : [],
      videos: (d.videos ?? []).map((v) => ({
        id: v.videoId,
        title: v.title,
        videoUrl: v.videoUrl,
        thumbnailUrl: v.thumbnailUrl ?? null,
      })),
    }
  },

  decide: async (applicationId: string, status: 'ACCEPTED' | 'REJECTED'): Promise<ApplicationResponse> => {
    const { data } = await apiClient.post<ApplicationResponse>(`/applications/${applicationId}/decision`, { status })
    return data
  },

  markReviewed: async (applicationId: string): Promise<ApplicationResponse> => {
    const { data } = await apiClient.post<ApplicationResponse>(`/applications/${applicationId}/mark-reviewed`)
    return data
  },

  accept: async (applicationId: string): Promise<ApplicationResponse> => applicationApi.decide(applicationId, 'ACCEPTED'),

  reject: async (applicationId: string): Promise<ApplicationResponse> => applicationApi.decide(applicationId, 'REJECTED'),
}
