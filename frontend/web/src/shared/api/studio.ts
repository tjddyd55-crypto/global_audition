import { apiClient } from './client'
import { unwrapData } from './unwrap'

export type StudioNotification = {
  id: string
  type: string
  status: string
  title: string
  body: string
  createdAt: string | null
  readAt: string | null
  auditionId: string | null
  applicationId: string | null
  channel: string
}

export const studioApi = {
  notifications: async (): Promise<StudioNotification[]> => {
    const { data } = await apiClient.get<unknown>('/me/notifications')
    const rows = unwrapData<StudioNotification[]>(data)
    return Array.isArray(rows) ? rows : []
  },
  markRead: async (id: string): Promise<StudioNotification> => {
    const { data } = await apiClient.post<unknown>(`/me/notifications/${id}/read`)
    return unwrapData(data) as StudioNotification
  },
}
