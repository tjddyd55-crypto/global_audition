import { apiClient } from './client'

export interface ApplicationVideoResponse {
  id: string
  applicationId: string
  videoUrl: string
  createdAt: string
}

export const applicationVideoApi = {
  list: async (applicationId: string): Promise<ApplicationVideoResponse[]> => {
    const { data } = await apiClient.get<ApplicationVideoResponse[]>(`/applications/${applicationId}/videos`)
    return data
  },
  create: async (applicationId: string, videoUrl: string): Promise<ApplicationVideoResponse> => {
    const { data } = await apiClient.post<ApplicationVideoResponse>(`/applications/${applicationId}/videos`, { videoUrl })
    return data
  },
  remove: async (videoId: string): Promise<void> => {
    await apiClient.delete(`/application-videos/${videoId}`)
  },
}
