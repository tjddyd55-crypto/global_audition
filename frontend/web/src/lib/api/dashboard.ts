import { apiClient } from './client'
import { unwrapData } from './unwrap'
import type { ApplicationResponseWithAudition } from './applications'
import type { AuditionResponse } from './auditions'

export interface AgencyDashboardResponse {
  totalAuditions: number
  openAuditions: number
  totalApplications: number
  accepted: number
  rejected: number
  pending: number
  recentAuditions: AuditionResponse[]
  recentApplications: ApplicationResponseWithAudition[]
}

export interface ApplicantDashboardResponse {
  applied: number
  reviewed: number
  accepted: number
  rejected: number
  videosCount: number
  recentApplications: ApplicationResponseWithAudition[]
}

export const dashboardApi = {
  getAgency: async (): Promise<AgencyDashboardResponse> => {
    const { data } = await apiClient.get<AgencyDashboardResponse>('/dashboard/agency')
    return data
  },
  getApplicant: async (): Promise<ApplicantDashboardResponse> => {
    const { data } = await apiClient.get<unknown>('/me/dashboard')
    const d = unwrapData<{
      stats: {
        appliedCount: number
        reviewingCount: number
        acceptedCount: number
        rejectedCount: number
        videoCount: number
      }
      recentApplications: Array<{
        applicationId: string
        auditionId: string
        auditionTitle: string
        appliedAt: string
        status: string
      }>
    }>(data)
    return {
      applied: d.stats.appliedCount,
      reviewed: d.stats.reviewingCount,
      accepted: d.stats.acceptedCount,
      rejected: d.stats.rejectedCount,
      videosCount: d.stats.videoCount,
      recentApplications: d.recentApplications.map((a) => ({
        id: a.applicationId,
        auditionId: a.auditionId,
        applicantId: '',
        applicantEmail: null,
        auditionTitle: a.auditionTitle,
        status: a.status as ApplicationResponseWithAudition['status'],
        createdAt: a.appliedAt,
      })),
    }
  },
}
