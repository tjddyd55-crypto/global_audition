import { apiClient } from '../client'
import type { AuditionDto } from '@/shared/types/audition'
import { parseAuditionDto } from './parsers'

/** 기획사·관리자: 동일 시리즈 다음 차 공고 생성(DRAFT) */
export const createNextSeriesRoundAudition = async (id: string): Promise<AuditionDto> => {
  const { data } = await apiClient.post<Record<string, unknown>>(`/auditions/${id}/series/next-round`)
  return parseAuditionDto(data ?? {})
}
