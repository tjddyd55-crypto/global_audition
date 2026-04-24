import { apiClient } from '../client'
import type { AuditionDto } from '@/shared/types/audition'
import { parseAuditionDto } from './parsers'

export const listOpenAuditions = async (): Promise<AuditionDto[]> => {
  const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions', { params: { status: 'OPEN' } })
  return (data ?? []).map((row) => parseAuditionDto(row))
}

export const getAuditionById = async (id: string): Promise<AuditionDto> => {
  const { data } = await apiClient.get<Record<string, unknown>>(`/auditions/${id}`)
  return parseAuditionDto(data ?? {})
}
