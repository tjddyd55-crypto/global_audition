import { apiClient } from './client'
import { unwrapData } from './unwrap'
import type { AuditionDto } from '@/shared/types/audition'
import { parseAuditionDto } from '@/shared/api/auditions/parsers'

export type RecommendationEligibility = 'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN'

export type RecommendedAuditionItem = {
  audition: AuditionDto
  reasons: string[]
  eligibility: RecommendationEligibility
  score: number
}

export type AuditionRecommendationPage = {
  items: RecommendedAuditionItem[]
  fallback: boolean
  personalized: boolean
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function parseItem(raw: unknown): RecommendedAuditionItem | null {
  const row = asRecord(raw)
  if (!row) return null
  const auditionRaw = asRecord(row.audition) ?? row
  try {
    const audition = parseAuditionDto(auditionRaw)
    const reasons = Array.isArray(row.reasons) ? row.reasons.map(String) : []
    const eligibilityRaw = String(row.eligibility ?? 'UNKNOWN').toUpperCase()
    const eligibility: RecommendationEligibility =
      eligibilityRaw === 'ELIGIBLE' || eligibilityRaw === 'INELIGIBLE' ? eligibilityRaw : 'UNKNOWN'
    return { audition, reasons, eligibility, score: Number(row.score ?? 0) }
  } catch {
    return null
  }
}

function parsePage(raw: unknown): AuditionRecommendationPage {
  const body = asRecord(raw) ?? asRecord(unwrapData(raw))
  const list = Array.isArray(raw) ? raw : Array.isArray(body?.items) ? body.items : []
  return {
    items: list.map(parseItem).filter((item): item is RecommendedAuditionItem => item != null),
    fallback: Boolean(body?.fallback),
    personalized: Boolean(body?.personalized),
  }
}

export const auditionRecommendationsApi = {
  list: async (country?: string, limit = 6): Promise<AuditionRecommendationPage> => {
    const { data } = await apiClient.get<unknown>('/auditions/recommendations', { params: { country, limit } })
    return parsePage(data)
  },
  closingSoon: async (country?: string, limit = 6): Promise<AuditionDto[]> => {
    const { data } = await apiClient.get<unknown>('/auditions/closing-soon', { params: { country, limit } })
    const rows = Array.isArray(data) ? data : Array.isArray((data as { items?: unknown })?.items) ? (data as { items: unknown[] }).items : []
    return rows.map((row) => parseAuditionDto(row))
  },
}

export const recommendationQueryKeys = {
  list: (country: string, limit: number, userId: string | null) =>
    ['audition-recommendations', country, limit, userId] as const,
  closingSoon: (country: string, limit: number) => ['auditions', 'closing-soon', country, limit] as const,
}
