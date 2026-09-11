import { apiClient } from '../client'

export type AuditionTranslationView = {
  auditionId: string
  locale: string
  title: string
  description: string
  location: string
  agencyName: string
  recruitFields: string[]
  qualifications: string[]
  schedules: string[]
  benefits: string[]
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | string
  provider: string
  updatedAt?: string | null
}

export type AuditionTranslationUpsert = {
  title: string
  description?: string
  location?: string
  agencyName?: string
  recruitFields?: string[]
  qualifications?: string[]
  schedules?: string[]
  benefits?: string[]
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item ?? '')).filter((item) => item.trim().length > 0)
}

function parseView(raw: Record<string, unknown>): AuditionTranslationView {
  return {
    auditionId: String(raw.auditionId ?? ''),
    locale: String(raw.locale ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    location: String(raw.location ?? ''),
    agencyName: String(raw.agencyName ?? ''),
    recruitFields: asStringArray(raw.recruitFields),
    qualifications: asStringArray(raw.qualifications),
    schedules: asStringArray(raw.schedules),
    benefits: asStringArray(raw.benefits),
    status: String(raw.status ?? 'PENDING'),
    provider: String(raw.provider ?? 'MANUAL'),
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : null,
  }
}

export async function listAuditionTranslations(auditionId: string): Promise<AuditionTranslationView[]> {
  const { data } = await apiClient.get<Record<string, unknown>[]>(
    `/auditions/${encodeURIComponent(auditionId)}/translations`,
  )
  return (data ?? []).map((row) => parseView(row))
}

export async function upsertAuditionTranslation(
  auditionId: string,
  locale: string,
  body: AuditionTranslationUpsert,
): Promise<AuditionTranslationView> {
  const { data } = await apiClient.put<Record<string, unknown>>(
    `/auditions/${encodeURIComponent(auditionId)}/translations/${encodeURIComponent(locale)}`,
    body,
  )
  return parseView(data ?? {})
}
