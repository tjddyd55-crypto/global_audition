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

export const getAuditionPreview = async (id: string, locale: string): Promise<AuditionDto> => {
  const { data } = await apiClient.get<Record<string, unknown>>(`/auditions/${encodeURIComponent(id)}/preview`, {
    params: { locale },
  })
  return parseAuditionDto(data ?? {})
}

/** 소유자 편집용. 공개 상세와 쿼리 키를 나누고, 로케일 오버레이를 적용하지 않는다. */
export const getAuditionOriginal = async (id: string): Promise<AuditionDto> => {
  const { data } = await apiClient.get<Record<string, unknown>>(`/auditions/${encodeURIComponent(id)}/original`)
  return parseAuditionDto(data ?? {})
}

export const getAuditionById = async (id: string, locale?: string): Promise<AuditionDto> => {
  const { data } = await apiClient.get<Record<string, unknown>>(`/auditions/${id}`, {
    params: { locale },
  })
  return parseAuditionDto(data ?? {})
}

/** 지금 열려 있는 공개 투표만. 일반 모집 목록과 별개다. */
export const listOpenVotes = async (
  locale?: string,
  country?: string,
): Promise<AuditionDto[]> => {
  const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions/voting', {
    params: openAuditionListParams(locale, country),
  })
  return (data ?? []).map((row) => parseAuditionDto(row))
}
