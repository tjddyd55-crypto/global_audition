import { apiClient } from './client'
import { unwrapData } from './unwrap'

export type SavedAuditionRecruitmentStatus = 'OPEN' | 'CLOSED' | 'UPCOMING' | 'UNAVAILABLE'

export type SavedAuditionItem = {
  auditionId: string
  savedAt: string
  available: boolean
  recruitmentStatus: SavedAuditionRecruitmentStatus
  title?: string | null
  agencyName?: string | null
  coverImage?: string | null
  countryCode?: string | null
  hostCountry?: string | null
  recruitFields?: string[]
  deadlineAt?: string | null
  startDate?: string | null
  endDate?: string | null
}

export const auditionSavesApi = {
  list: async (): Promise<SavedAuditionItem[]> => {
    const { data } = await apiClient.get<unknown>('/me/audition-saves')
    const rows = unwrapData(data)
    return Array.isArray(rows) ? (rows as SavedAuditionItem[]) : []
  },
  ids: async (): Promise<string[]> => {
    const { data } = await apiClient.get<unknown>('/me/audition-saves/ids')
    const body = unwrapData(data) as { ids?: string[] } | string[] | null
    if (Array.isArray(body)) return body.map(String)
    return Array.isArray(body?.ids) ? body.ids.map(String) : []
  },
  save: async (auditionId: string): Promise<SavedAuditionItem> => {
    const { data } = await apiClient.put<unknown>(`/me/audition-saves/${auditionId}`)
    return unwrapData(data) as SavedAuditionItem
  },
  unsave: async (auditionId: string): Promise<void> => {
    await apiClient.delete(`/me/audition-saves/${auditionId}`)
  },
}

export const auditionSaveQueryKeys = {
  ids: ['audition-saves', 'ids'] as const,
  list: ['audition-saves', 'list'] as const,
}
