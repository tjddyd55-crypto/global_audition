import { apiClient } from './client'

export interface ApplicationResponse {
  id: string
  auditionId: string
  applicantId: string
  applicantEmail: string | null
  status: 'SUBMITTED' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
  message?: string | null
  updatedAt?: string
  createdAt: string
}

export interface ApplicationResponseWithAudition extends ApplicationResponse {
  auditionTitle?: string
}

export const applicationApi = {
  listMy: async (): Promise<ApplicationResponseWithAudition[]> => {
    const { data } = await apiClient.get<ApplicationResponseWithAudition[]>('/applications/my')
    return data
  },

  apply: async (auditionId: string): Promise<ApplicationResponse> => {
    const { data } = await apiClient.post<ApplicationResponse>(`/auditions/${auditionId}/apply`)
    return data
  },

  listByAudition: async (auditionId: string): Promise<ApplicationResponse[]> => {
    const { data } = await apiClient.get<ApplicationResponse[]>(`/auditions/${auditionId}/applications`)
    return data
  },

  getById: async (applicationId: string): Promise<ApplicationResponseWithAudition> => {
    const { data } = await apiClient.get<ApplicationResponseWithAudition>(`/applications/${applicationId}`)
    return data
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
