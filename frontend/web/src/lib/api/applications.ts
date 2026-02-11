import { apiClient } from './client'

export interface ApplicationResponse {
  id: string
  auditionId: string
  applicantId: string
  applicantEmail: string | null
  status: 'SUBMITTED' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
  createdAt: string
}

export interface ApplicationResponseWithAudition extends ApplicationResponse {
  auditionTitle?: string
}

export const applicationApi = {
  listMy: async (): Promise<ApplicationResponseWithAudition[]> => {
    const { data } = await apiClient.get<ApplicationResponseWithAudition[]>('/applications/me')
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

  updateStatus: async (applicationId: string, status: 'REVIEWED' | 'ACCEPTED' | 'REJECTED'): Promise<ApplicationResponse> => {
    const { data } = await apiClient.patch<ApplicationResponse>(`/applications/${applicationId}/status`, { status })
    return data
  },

  accept: async (applicationId: string): Promise<ApplicationResponse> => {
    const { data } = await apiClient.patch<ApplicationResponse>(`/applications/${applicationId}/status`, { status: 'ACCEPTED' })
    return data
  },

  reject: async (applicationId: string): Promise<ApplicationResponse> => {
    const { data } = await apiClient.patch<ApplicationResponse>(`/applications/${applicationId}/status`, { status: 'REJECTED' })
    return data
  },
}
