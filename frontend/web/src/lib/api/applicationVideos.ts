import { apiClient } from './client'
import { unwrapData } from './unwrap'

export interface ApplicationVideoResponse {
  id: string
  applicationId?: string
  title?: string
  videoUrl: string
  createdAt?: string
}

export const applicationVideoApi = {
  list: async (applicationId: string): Promise<ApplicationVideoResponse[]> => {
    const { data } = await apiClient.get<unknown>(`/applications/${applicationId}/videos`)
    return Array.isArray(data) ? data : unwrapData<ApplicationVideoResponse[]>(data)
  },
  create: async (applicationId: string, videoUrl: string, title?: string): Promise<ApplicationVideoResponse> => {
    const { data } = await apiClient.post<unknown>(`/me/applications/${applicationId}/videos`, {
      videoUrl,
      title: title?.trim() || 'Audition Video',
    })
    const v = unwrapData<{ videoId: string; title: string; videoUrl: string }>(data)
    return {
      id: v.videoId,
      title: v.title,
      videoUrl: v.videoUrl,
    }
  },
  remove: async (applicationId: string, videoId: string): Promise<void> => {
    await apiClient.delete(`/me/applications/${applicationId}/videos/${videoId}`)
  },
}
