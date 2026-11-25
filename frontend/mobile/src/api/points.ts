import { apiRequest } from './http'
import type { PointDashboard, PointEntry, PointQuote } from '../../../web/src/shared/audition/points'

export const pointsApi = {
  dashboard: () => apiRequest<PointDashboard>('/me/points'),
  quote: () => apiRequest<PointQuote>('/me/points/application-quote'),
  entries: (page: number) => apiRequest<PointEntry[]>('/me/points/entries', { query: { page } }),
  checkIn: () => apiRequest<PointDashboard>('/me/points/check-in', { method: 'POST' }),
  invite: async () => (await apiRequest<{ code: string }>('/me/points/invite-code', { method: 'POST' })).code,
  confirmReferral: () => apiRequest<PointDashboard>('/me/points/confirm-invitation', { method: 'POST' }),
}
