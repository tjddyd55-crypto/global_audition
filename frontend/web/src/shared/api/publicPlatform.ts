import { apiClient } from './client'
import { unwrapData } from './unwrap'
import { parseAuditionDto } from './auditions/parsers'
import type { AuditionDto } from '@/shared/types/audition'

export type PublicBrowseParams = {
  recruitment?: string
  country?: string
  category?: string
  agency?: string
  q?: string
  from?: string
  to?: string
}

export type PublicAgencyCard = {
  id: string
  displayName: string
  countryCode: string
  website: string | null
  openAuditionCount: number
}

export type PublicAgencyAudition = {
  id: string
  title: string
  status: string
  countryCode: string | null
  deadlineAt: string | null
}

export type PublicAgencyDetail = {
  id: string
  displayName: string
  countryCode: string
  website: string | null
  auditions: PublicAgencyAudition[]
}

export const publicPlatformApi = {
  browseAuditions: async (params: PublicBrowseParams): Promise<AuditionDto[]> => {
    const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions/browse', { params })
    return (data ?? []).map((row) => parseAuditionDto(row))
  },
  agencies: async (): Promise<PublicAgencyCard[]> => {
    const { data } = await apiClient.get<unknown>('/agencies/public')
    const rows = unwrapData<PublicAgencyCard[]>(data)
    return Array.isArray(rows) ? rows : []
  },
  agency: async (id: string): Promise<PublicAgencyDetail> => {
    const { data } = await apiClient.get<unknown>(`/agencies/public/${id}`)
    return unwrapData(data) as PublicAgencyDetail
  },
}
