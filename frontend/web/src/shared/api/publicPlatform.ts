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
  field?: string
  sort?: string
}

export type PublicBrowsePage = { items: AuditionDto[]; total: number; page: number; size: number }

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
  /** 같은 /auditions/browse 에 page/size 를 붙여 서버에서 필터·정렬·페이지 처리. 전체 건수는 X-Total-Count. */
  browseAuditionsPage: async (
    params: PublicBrowseParams & { page: number; size: number },
  ): Promise<PublicBrowsePage> => {
    const res = await apiClient.get<Record<string, unknown>[]>('/auditions/browse', { params })
    const items = (res.data ?? []).map((row) => parseAuditionDto(row))
    const header = Number(res.headers?.['x-total-count'])
    const total = Number.isFinite(header) ? header : params.page * params.size + items.length
    return { items, total, page: params.page, size: params.size }
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
