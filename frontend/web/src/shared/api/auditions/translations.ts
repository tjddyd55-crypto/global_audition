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
  errorCode?: string | null
  errorMessage?: string | null
  sourceHash?: string | null
  sourceRevision?: number | null
  origin?: 'MANUAL' | 'AUTO' | string
  manuallyEdited?: boolean
  stale?: boolean
  attemptStatus?: string | null
  attemptErrorCode?: string | null
  attemptErrorMessage?: string | null
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
    errorCode: raw.errorCode != null ? String(raw.errorCode) : null,
    errorMessage: raw.errorMessage != null ? String(raw.errorMessage) : null,
    sourceHash: raw.sourceHash != null ? String(raw.sourceHash) : null,
    sourceRevision: typeof raw.sourceRevision === 'number' ? raw.sourceRevision : null,
    origin: raw.origin != null ? String(raw.origin) : 'MANUAL',
    manuallyEdited: raw.manuallyEdited === true,
    stale: raw.stale === true,
    attemptStatus: raw.attemptStatus != null ? String(raw.attemptStatus) : null,
    attemptErrorCode: raw.attemptErrorCode != null ? String(raw.attemptErrorCode) : null,
    attemptErrorMessage: raw.attemptErrorMessage != null ? String(raw.attemptErrorMessage) : null,
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : null,
  }
}

export type TranslationProviderStatus = {
  provider: string
  state: 'CONFIGURED' | 'NOT_CONFIGURED' | string
}

export async function getTranslationProviderStatus(auditionId: string): Promise<TranslationProviderStatus> {
  const { data } = await apiClient.get<TranslationProviderStatus>(
    `/auditions/${encodeURIComponent(auditionId)}/translation-provider`,
  )
  return {
    provider: String(data?.provider ?? ''),
    state: String(data?.state ?? 'NOT_CONFIGURED'),
  }
}

export async function runTranslationJob(
  auditionId: string,
  body: { locale?: string; force?: boolean },
): Promise<AuditionTranslationView[]> {
  const { data } = await apiClient.post<Record<string, unknown>[]>(
    `/auditions/${encodeURIComponent(auditionId)}/translation-jobs`,
    body,
  )
  return (data ?? []).map((row) => parseView(row))
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
