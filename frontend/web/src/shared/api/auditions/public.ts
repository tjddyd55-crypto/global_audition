import { apiClient } from '../client'
import type { AuditionDto } from '@/shared/types/audition'
import { openAuditionListParams } from '@/shared/audition/audienceSelection'
import { parseAuditionDto } from './parsers'

export const listOpenAuditions = async (
  locale?: string,
  country?: string,
): Promise<AuditionDto[]> => {
  const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions', {
    params: openAuditionListParams(locale, country),
  })
  return (data ?? []).map((row) => parseAuditionDto(row))
}

export const getAuditionById = async (id: string, locale?: string): Promise<AuditionDto> => {
  const { data } = await apiClient.get<Record<string, unknown>>(`/auditions/${id}`, {
    params: { locale },
  })
  return parseAuditionDto(data ?? {})
}
