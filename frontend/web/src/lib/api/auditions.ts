import { apiClient } from './client'
import type { AuditionDto, AuditionDetailContent, CreateAuditionPayload } from '../types/audition'

/** @deprecated 레거시 import 호환 — AuditionDto와 동일 */
export type { AuditionDto as AuditionResponse } from '../types/audition'
import { emptyDetailContent } from '../types/audition'

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.filter((x) => typeof x === 'string') as string[]
}

function parseDetailContent(raw: unknown): AuditionDetailContent {
  if (!raw || typeof raw !== 'object') return emptyDetailContent()
  const o = raw as Record<string, unknown>
  return {
    recruit: asStringArray(o.recruit),
    qualification: asStringArray(o.qualification),
    schedule: asStringArray(o.schedule),
    benefits: asStringArray(o.benefits),
  }
}

export function parseAuditionDto(raw: Record<string, unknown>): AuditionDto {
  return {
    id: String(raw.id ?? ''),
    ownerId: String(raw.ownerId ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    status: String(raw.status ?? 'DRAFT'),
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : undefined,
    countryCode: raw.countryCode != null ? String(raw.countryCode) : null,
    deadlineAt: raw.deadlineAt != null ? String(raw.deadlineAt) : null,
    category: String(raw.category ?? ''),
    createdAt: String(raw.createdAt ?? ''),
    coverImage: raw.coverImage != null ? String(raw.coverImage) : null,
    videoUrl: raw.videoUrl != null ? String(raw.videoUrl) : null,
    galleryImages: asStringArray(raw.galleryImages),
    agencyName: String(raw.agencyName ?? ''),
    agencyLogo: raw.agencyLogo != null ? String(raw.agencyLogo) : null,
    applicantsCount: Number(raw.applicantsCount ?? 0),
    remainingDays: Number(raw.remainingDays ?? 0),
    recruitFields: asStringArray(raw.recruitFields),
    location: String(raw.location ?? ''),
    startDate: String(raw.startDate ?? ''),
    endDate: String(raw.endDate ?? ''),
    detailContent: parseDetailContent(raw.detailContent),
    benefits: asStringArray(raw.benefits),
  }
}

export const auditionApi = {
  listOpen: async (): Promise<AuditionDto[]> => {
    const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions', { params: { status: 'OPEN' } })
    return (data ?? []).map((row) => parseAuditionDto(row))
  },

  getById: async (id: string): Promise<AuditionDto> => {
    const { data } = await apiClient.get<Record<string, unknown>>(`/auditions/${id}`)
    return parseAuditionDto(data ?? {})
  },

  create: async (body: CreateAuditionPayload): Promise<AuditionDto> => {
    const { data } = await apiClient.post<Record<string, unknown>>('/auditions', body)
    return parseAuditionDto(data ?? {})
  },

  getMyAuditions: async (_params: { page?: number; size?: number } = {}): Promise<{ content: AuditionDto[]; totalPages: number }> => {
    const { data } = await apiClient.get<Record<string, unknown>[]>('/auditions/my')
    const content = (data ?? []).map((row) => parseAuditionDto(row))
    return { content, totalPages: Math.max(1, Math.ceil(content.length / 20)) }
  },

  update: async (
    id: string,
    body: Partial<CreateAuditionPayload> & Record<string, unknown>
  ): Promise<AuditionDto> => {
    const { data } = await apiClient.patch<Record<string, unknown>>(`/auditions/${id}`, body)
    return parseAuditionDto(data ?? {})
  },

  deleteAudition: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/auditions/${id}`)
  },
}
