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

export interface ApplicationDetailWithVideos extends ApplicationResponseWithAudition {
  videos?: Array<{ id: string; title: string; videoUrl: string; createdAt?: string }>
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

  apply: async (auditionId: string): Promise<ApplicationResponse> => {
    const { data } = await apiClient.post<ApplicationResponse>(`/auditions/${auditionId}/apply`)
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
      videos: Array<{ videoId: string; title: string; videoUrl: string }>
    }>(data)
    return {
      id: d.applicationId,
      auditionId: d.auditionId,
      applicantId: '',
      applicantEmail: null,
      auditionTitle: d.auditionTitle,
      status: d.status as ApplicationResponse['status'],
      createdAt: typeof d.appliedAt === 'string' ? d.appliedAt : String(d.appliedAt),
      videos: (d.videos ?? []).map((v) => ({
        id: v.videoId,
        title: v.title,
        videoUrl: v.videoUrl,
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
