import { apiClient } from './client'
import type { PointDashboard, PointEntry, PointQuote } from '@/shared/audition/points'

export const pointsApi = {
  dashboard: async () => (await apiClient.get<PointDashboard>('/me/points')).data,
  quote: async () => (await apiClient.get<PointQuote>('/me/points/application-quote')).data,
  entries: async (page: number) => (await apiClient.get<PointEntry[]>('/me/points/entries', { params: { page } })).data,
  checkIn: async () => (await apiClient.post<PointDashboard>('/me/points/check-in')).data,
  invite: async () => (await apiClient.post<{ code: string }>('/me/points/invite-code')).data.code,
  confirmReferral: async () => (await apiClient.post<PointDashboard>('/me/points/confirm-invitation')).data,
}
