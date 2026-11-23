import { apiClient } from './client'
import { unwrapData } from './unwrap'

export type StudioNotification = {
  id: string
  type: string
  status: string
  title: string
  body: string
  titleKey?: string | null
  bodyKey?: string | null
  roundId?: string | null
  link?: string | null
  params?: Record<string, string> | null
  createdAt: string | null
  readAt: string | null
  auditionId: string | null
  applicationId: string | null
  channel: string
}

export type NotificationSettings = {
  savedDeadline: boolean
  newMatch: boolean
  results: boolean
  offers: boolean
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
  notificationSettings: async (): Promise<NotificationSettings> => {
    const { data } = await apiClient.get<unknown>('/me/notification-settings')
    return unwrapData(data) as NotificationSettings
  },
  updateNotificationSettings: async (body: NotificationSettings): Promise<NotificationSettings> => {
    const { data } = await apiClient.put<unknown>('/me/notification-settings', body)
    return unwrapData(data) as NotificationSettings
  },
}
