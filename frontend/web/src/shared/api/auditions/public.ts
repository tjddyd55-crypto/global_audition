import { apiClient } from '../client'
import type { AuditionDto } from '@/shared/types/audition'
import { audienceCountryFromLocale } from '@/shared/audition/audience'
import { parseAuditionDto } from './parsers'

export const listOpenAuditions = async (locale?: string): Promise<AuditionDto[]> => {
  const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions', {
    params: { status: 'OPEN', locale, country: audienceCountryFromLocale(locale) },
  })
  return (data ?? []).map((row) => parseAuditionDto(row))
}

export const getAuditionById = async (id: string, locale?: string): Promise<AuditionDto> => {
  const { data } = await apiClient.get<Record<string, unknown>>(`/auditions/${id}`, {
    params: { locale },
  })
  return parseAuditionDto(data ?? {})
}
