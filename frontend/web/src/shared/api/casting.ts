import { apiClient } from './client'
import { unwrapData } from './unwrap'
import { parseOffer, type CastingOffer, type CastingParty, type OfferDraft, draftBody } from '../casting/model'

export type TalentCard = {
  userId: string
  nickname: string | null
  realName: string | null
  profileImageUrl: string | null
  nationality: string | null
  residenceCountry: string | null
  ageBand: string | null
  mainField: string | null
  fields: string[]
  languages: string[]
  shortBio: string | null
  careerCount: number
  videoCount: number
  followers: number
  lastActiveAt: string | null
  acceptsOffers: boolean
  featuredThumbnailUrl: string | null
  saved: boolean
  savedGroup: string | null
  lastOfferStatus: string | null
  available: boolean
  /** 성별 공개를 켠 회원만. */
  gender?: string | null
}

export type TalentSearchParams = {
  q?: string
  nationality?: string
  residence?: string
  ageBand?: string[]
  field?: string
  language?: string
  hasCareer?: boolean
  activeWithinDays?: number
  acceptsOffers?: boolean
  gender?: string
  sort?: string
  limit?: number
  offset?: number
}

export type SavedTalent = { id: string; group: string | null; memo: string | null; savedAt: string | null; talent: TalentCard }
export type CastingQuota = { sentToday: number; dailyLimit: number; restricted: boolean; restrictedReason: string | null; approved: boolean }

const list = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

function cleanParams(p: TalentSearchParams): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === '' || v === 'ALL' || v === false) continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out
}

export const agencyCastingApi = {
  search: async (p: TalentSearchParams): Promise<{ items: TalentCard[]; total: number }> => {
    const { data } = await apiClient.get<unknown>('/agency/talents/search', {
      params: cleanParams(p),
      paramsSerializer: { indexes: null },
    })
    const body = unwrapData<{ items?: unknown; total?: unknown }>(data) ?? {}
    return { items: list<TalentCard>(body.items), total: Number(body.total ?? 0) }
  },
  saved: async (group?: string): Promise<SavedTalent[]> => {
    const { data } = await apiClient.get<unknown>('/agency/talents/saved', { params: group ? { group } : undefined })
    return list<SavedTalent>(unwrapData(data))
  },
  groups: async (): Promise<string[]> => {
    const { data } = await apiClient.get<unknown>('/agency/talents/saved/groups')
    return list<string>(unwrapData(data))
  },
  save: async (talentId: string, group?: string | null, memo?: string | null): Promise<SavedTalent> => {
    const { data } = await apiClient.post<unknown>(`/agency/talents/saved/${talentId}`, { group: group ?? null, memo: memo ?? null })
    return unwrapData(data) as SavedTalent
  },
  updateSaved: async (talentId: string, group: string | null, memo: string | null): Promise<SavedTalent> => {
    const { data } = await apiClient.put<unknown>(`/agency/talents/saved/${talentId}`, { group, memo })
    return unwrapData(data) as SavedTalent
  },
  unsave: async (talentId: string): Promise<void> => {
    await apiClient.delete(`/agency/talents/saved/${talentId}`)
  },
  quota: async (): Promise<CastingQuota> => {
    const { data } = await apiClient.get<unknown>('/agency/casting-offers/quota')
    return unwrapData(data) as CastingQuota
  },
  preview: async (d: OfferDraft): Promise<{ offer: CastingOffer; warnings: string[] }> => {
    const { data } = await apiClient.post<unknown>('/agency/casting-offers/preview', draftBody(d))
    const body = unwrapData<{ offer?: unknown; warnings?: unknown }>(data) ?? {}
    return { offer: parseOffer(body.offer), warnings: list<string>(body.warnings) }
  },
  send: async (d: OfferDraft): Promise<CastingOffer> => {
    const { data } = await apiClient.post<unknown>('/agency/casting-offers', draftBody(d))
    return parseOffer(unwrapData(data))
  },
  offers: async (status?: string, talentId?: string): Promise<CastingOffer[]> => {
    const { data } = await apiClient.get<unknown>('/agency/casting-offers', {
      params: { ...(status ? { status } : {}), ...(talentId ? { talentId } : {}) },
    })
    return list<unknown>(unwrapData(data)).map(parseOffer)
  },
  offer: async (id: string): Promise<CastingOffer> => {
    const { data } = await apiClient.get<unknown>(`/agency/casting-offers/${id}`)
    return parseOffer(unwrapData(data))
  },
  withdraw: async (id: string, note?: string): Promise<CastingOffer> => {
    const { data } = await apiClient.post<unknown>(`/agency/casting-offers/${id}/withdraw`, { note: note ?? null })
    return parseOffer(unwrapData(data))
  },
}

export const myCastingApi = {
  offers: async (): Promise<CastingOffer[]> => {
    const { data } = await apiClient.get<unknown>('/me/casting-offers')
    return list<unknown>(unwrapData(data)).map(parseOffer)
  },
  offer: async (id: string): Promise<CastingOffer> => {
    const { data } = await apiClient.get<unknown>(`/me/casting-offers/${id}`)
    return parseOffer(unwrapData(data))
  },
  accept: async (id: string, shareContact: boolean, note?: string): Promise<CastingOffer> => {
    const { data } = await apiClient.post<unknown>(`/me/casting-offers/${id}/accept`, { shareContact, note: note ?? null })
    return parseOffer(unwrapData(data))
  },
  decline: async (id: string, reason: string, note?: string): Promise<CastingOffer> => {
    const { data } = await apiClient.post<unknown>(`/me/casting-offers/${id}/decline`, { reason, note: note ?? null })
    return parseOffer(unwrapData(data))
  },
  report: async (id: string, reason: string, detail: string, blockAgency: boolean): Promise<void> => {
    await apiClient.post(`/me/casting-offers/${id}/report`, { reason, detail, blockAgency })
  },
  block: async (id: string): Promise<void> => {
    await apiClient.post(`/me/casting-offers/${id}/block`, {})
  },
  blocks: async (): Promise<CastingParty[]> => {
    const { data } = await apiClient.get<unknown>('/me/casting-blocks')
    return list<CastingParty>(unwrapData(data))
  },
  unblock: async (agencyUserId: string): Promise<void> => {
    await apiClient.delete(`/me/casting-blocks/${agencyUserId}`)
  },
}

export type CountRow = { key: string; count: number }
export type CastingStats = {
  publicChannels: number
  channelsByCountry: CountRow[]
  talentsByField: CountRow[]
  publicVideos: number
  talentSearchVisible: number
  castingOptIn: number
  dailyOffers: { day: string; sent: number; accepted: number }[]
  offersByAgency: {
    agencyUserId: string
    name: string | null
    sent: number
    accepted: number
    declined: number
    open: number
    acceptanceRate: number
    restricted: boolean
    dailyLimit: number | null
    openReports: number
  }[]
  totalOffers: number
  acceptanceRate: number
  offersByStatus: CountRow[]
  reportsByStatus: CountRow[]
}
export type CastingReport = {
  id: string
  offerId: string | null
  offerTitle: string | null
  agencyUserId: string
  agencyName: string | null
  reporterUserId: string
  reporterName: string | null
  reason: string
  detail: string | null
  status: string
  resolutionNote: string | null
  createdAt: string | null
  handledAt: string | null
}
export type AgencyControl = {
  agencyUserId: string
  email: string | null
  name: string | null
  approved: boolean
  restricted: boolean
  reason: string | null
  dailyLimit: number | null
  planCode: string
  sent30d: number
  openReports: number
}
export type ModerationChannel = {
  userId: string
  nickname: string | null
  email: string | null
  publicChannel: boolean
  hidden: boolean
  videos: number
}
export type ModerationVideo = {
  videoId: string
  title: string | null
  videoUrl: string | null
  visibility: string
  hidden: boolean
  embedStatus: string | null
  viewCount: number
}

export const adminCastingApi = {
  stats: async (): Promise<CastingStats> => {
    const { data } = await apiClient.get<unknown>('/admin/casting/stats')
    return unwrapData(data) as CastingStats
  },
  reports: async (status?: string): Promise<CastingReport[]> => {
    const { data } = await apiClient.get<unknown>('/admin/casting/reports', { params: status ? { status } : undefined })
    return list<CastingReport>(unwrapData(data))
  },
  resolve: async (id: string, status: 'RESOLVED' | 'DISMISSED', note: string, restrictAgency: boolean): Promise<void> => {
    await apiClient.post(`/admin/casting/reports/${id}/resolve`, { status, note, restrictAgency })
  },
  agencies: async (): Promise<AgencyControl[]> => {
    const { data } = await apiClient.get<unknown>('/admin/casting/agencies')
    return list<AgencyControl>(unwrapData(data))
  },
  setControl: async (agencyUserId: string, restricted: boolean, reason: string, dailyLimit: number | null): Promise<void> => {
    await apiClient.put(`/admin/casting/agencies/${agencyUserId}/control`, { restricted, reason, dailyLimit })
  },
  channels: async (q?: string): Promise<ModerationChannel[]> => {
    const { data } = await apiClient.get<unknown>('/admin/casting/channels', { params: q ? { q } : undefined })
    return list<ModerationChannel>(unwrapData(data))
  },
  videos: async (userId: string): Promise<ModerationVideo[]> => {
    const { data } = await apiClient.get<unknown>(`/admin/casting/channels/${userId}/videos`)
    return list<ModerationVideo>(unwrapData(data))
  },
  moderateChannel: async (userId: string, hidden: boolean, reason: string): Promise<void> => {
    await apiClient.post(`/admin/casting/channels/${userId}/moderation`, { hidden, reason })
  },
  moderateVideo: async (videoId: string, hidden: boolean, reason: string): Promise<void> => {
    await apiClient.post(`/admin/casting/videos/${videoId}/moderation`, { hidden, reason })
  },
}
