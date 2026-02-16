import { apiClient } from './client'
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
    const { data } = await apiClient.get<ApplicantDashboardResponse>('/dashboard/applicant')
    return data
  },
}
