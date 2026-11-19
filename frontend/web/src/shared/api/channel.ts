import { apiClient } from './client'
import { normalizePublicChannelVideoListPayload, parseMyChannelVideoRow } from './channelVideoPublic'
import { unwrapData } from './unwrap'
import type { MyChannelVideoRow } from './videos'

export type { MyChannelVideoRow }

/** PATCH/GET 공통. PATCH 시 서버는 대문자·소문자 모두 허용(저장 시 소문자 정규화). */
export type SnsPlatformCode = 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK' | 'TWITTER' | 'FACEBOOK' | 'OTHER'

export type SnsLinkRow = {
  platform: string
  url: string
}

export type MyChannelSummary = {
  channelId: string
  channelName: string
  channelDescription?: string
  profileImageUrl?: string | null
  /** GET 응답 JSON `profileImage` (서버에서 profileImageUrl 과 동일) */
  profileImage?: string | null
  bannerImageUrl?: string | null
  videoCount: number
  subscriberCount: number
  viewCount: number
  /** 레거시 isPublic */
  channelPublic?: boolean
  isPublic?: boolean
  /** 채널 이름으로 쓰는 닉네임 */
  nickname?: string
  introText?: string | null
  nationality?: string | null
  shortBio?: string | null
  bio?: string | null
  categories?: string[]
  featuredVideoId?: string | null
  snsLinks?: SnsLinkRow[]
  name?: string | null
  careerText?: string | null
  activityFields?: string[]
  shownFields?: string[]
  selectionCustomized?: boolean
  userId?: string
  residenceCountry?: string | null
  languages?: string[]
  talents?: string | null
  talentSearchVisible?: boolean
  castingOffersEnabled?: boolean
  /** U18 · 18_19 · 20_24 … (생년월일은 내려오지 않는다) */
  ageBand?: string | null
  adultConfirmed?: boolean
  birthDateSet?: boolean
  maxVideos?: number
}

export type ChannelCareerCategory = 'PERFORMANCE' | 'TRAINING' | 'DANCE_VOCAL' | 'ACTING_MODEL' | 'CONTEST_AWARD' | 'OTHER'

export type ChannelCareer = {
  id: string
  category: ChannelCareerCategory
  title: string
  organization?: string | null
  periodStart?: string | null
  periodEnd?: string | null
  description?: string | null
  visible: boolean
  sortOrder: number
}

export type ChannelCareerInput = Partial<Omit<ChannelCareer, 'id'>> & { sourceLocale?: string }

export type PatchMyChannelBody = {
  nickname?: string
  channelName?: string
  channelDescription?: string
  introText?: string | null
  profileImage?: string | null
  profileImageUrl?: string | null
  bannerImageUrl?: string | null
  /** 채널 공개 여부(권장). `sanitizePatchMyChannelBody`에서 전송 시 정규화됨. */
  isChannelPublic?: boolean
  /** 레거시 (sanitize 시 isChannelPublic 으로 통합) */
  is_channel_public?: boolean
  isPublic?: boolean
  snsLinks?: SnsLinkRow[]
  nationality?: string
  country?: string
  shortBio?: string | null
  bio?: string | null
  categories?: string[]
  featuredVideoId?: string | null
  shownFields?: string[]
  residenceCountry?: string | null
  languages?: string[]
  talents?: string | null
  talentSearchVisible?: boolean
  castingOffersEnabled?: boolean
}

/**
 * PATCH /me/channel 요청 본문 정리: 빈 문자열 필드 제거, 공개 플래그·SNS 플랫폼 키 통일.
 * 백엔드 `is_channel_public` / `isChannelPublic` / `isPublic` 모두 수용.
 */
export function sanitizePatchMyChannelBody(body: PatchMyChannelBody): Record<string, unknown> {
  const out: Record<string, unknown> = {}

  const putNonEmptyString = (key: string, v: string | undefined) => {
    if (v === undefined) return
    const t = v.trim()
    if (t === '') return
    out[key] = t
  }

  putNonEmptyString('nickname', body.nickname)
  putNonEmptyString('channelName', body.channelName)
  putNonEmptyString('channelDescription', body.channelDescription)

  if (body.introText !== undefined) {
    if (body.introText === null) {
      out.introText = null
    } else {
      const t = body.introText.trim()
      out.introText = t === '' ? null : t
    }
  }

  const channelPublic = body.isChannelPublic ?? body.is_channel_public ?? body.isPublic
  if (channelPublic !== undefined) {
    out.isChannelPublic = channelPublic
  }

  if (body.profileImage !== undefined) {
    if (body.profileImage === null) {
      out.profileImage = null
    } else {
      putNonEmptyString('profileImage', body.profileImage)
    }
  }
  if (body.profileImageUrl !== undefined) {
    if (body.profileImageUrl === null) {
      out.profileImageUrl = null
    } else {
      putNonEmptyString('profileImageUrl', body.profileImageUrl)
    }
  }
  if (body.bannerImageUrl !== undefined) {
    if (body.bannerImageUrl === null) {
      out.bannerImageUrl = null
    } else {
      putNonEmptyString('bannerImageUrl', body.bannerImageUrl)
    }
  }

  if (body.snsLinks !== undefined) {
    out.snsLinks = body.snsLinks
      .map((row) => ({
        platform: String(row.platform ?? '')
          .trim()
          .toUpperCase(),
        url: String(row.url ?? '').trim(),
      }))
      .filter((row) => row.platform.length > 0 && row.url.length > 0)
  }

  if (body.nationality !== undefined) {
    out.nationality = body.nationality.trim().toUpperCase()
  }
  if (body.country !== undefined) {
    out.country = body.country.trim().toUpperCase()
  }
  if (body.shortBio !== undefined) {
    out.shortBio = body.shortBio === null ? null : String(body.shortBio).trim() === '' ? null : String(body.shortBio).trim()
  }
  if (body.bio !== undefined) {
    out.bio = body.bio === null ? null : body.bio.trim() === '' ? null : body.bio.trim()
  }
  if (body.categories !== undefined) {
    out.categories = body.categories
  }
  if (body.featuredVideoId !== undefined) {
    out.featuredVideoId = body.featuredVideoId === null ? null : String(body.featuredVideoId).trim()
  }
  if (body.shownFields !== undefined) {
    out.shownFields = body.shownFields
  }
  if (body.residenceCountry !== undefined) {
    out.residenceCountry = body.residenceCountry === null ? '' : body.residenceCountry.trim().toUpperCase()
  }
  if (body.languages !== undefined) out.languages = body.languages
  if (body.talents !== undefined) out.talents = body.talents === null ? '' : body.talents
  if (body.talentSearchVisible !== undefined) out.talentSearchVisible = body.talentSearchVisible
  if (body.castingOffersEnabled !== undefined) out.castingOffersEnabled = body.castingOffersEnabled

  return out
}

function normalizeChannel(raw: Record<string, unknown>): MyChannelSummary {
  const isPublic =
    typeof raw.channelPublic === 'boolean'
      ? raw.channelPublic
      : typeof raw.isPublic === 'boolean'
        ? raw.isPublic
        : typeof raw.is_channel_public === 'boolean'
          ? raw.is_channel_public
          : false
  const prof =
    (raw.profileImageUrl as string | null | undefined) ?? (raw.profileImage as string | null | undefined) ?? null
  const snsRaw = raw.snsLinks
  let snsLinks: SnsLinkRow[] | undefined
  if (Array.isArray(snsRaw)) {
    snsLinks = snsRaw.map((x) => {
      const o = x as Record<string, unknown>
      return {
        platform: String(o.platform ?? ''),
        url: String(o.url ?? ''),
      }
    })
  }
  return {
    channelId: String(raw.channelId ?? ''),
    channelName: String(raw.channelName ?? ''),
    channelDescription: raw.channelDescription != null ? String(raw.channelDescription) : undefined,
    profileImageUrl: prof,
    profileImage: raw.profileImage != null ? String(raw.profileImage) : prof,
    bannerImageUrl: (raw.bannerImageUrl as string | null | undefined) ?? null,
    videoCount: Number(raw.videoCount ?? 0),
    subscriberCount: Number(raw.subscriberCount ?? 0),
    viewCount: Number(raw.viewCount ?? 0),
    channelPublic: isPublic,
    isPublic,
    nickname: raw.nickname != null ? String(raw.nickname) : undefined,
    introText: raw.introText != null ? String(raw.introText) : null,
    nationality: raw.nationality != null ? String(raw.nationality) : null,
    bio: raw.bio != null ? String(raw.bio) : null,
    categories: Array.isArray(raw.categories)
      ? (raw.categories as unknown[]).map((x) => String(x ?? '').trim()).filter((s) => s.length > 0)
      : [],
    featuredVideoId:
      raw.featuredVideoId != null && String(raw.featuredVideoId).trim() !== ''
        ? String(raw.featuredVideoId)
        : undefined,
    snsLinks,
    name: raw.name != null ? String(raw.name) : null,
    shortBio: raw.shortBio != null ? String(raw.shortBio) : null,
    careerText: raw.careerText != null ? String(raw.careerText) : null,
    activityFields: Array.isArray(raw.activityFields)
      ? (raw.activityFields as unknown[]).map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
      : [],
    shownFields: Array.isArray(raw.shownFields) ? (raw.shownFields as unknown[]).map((item) => String(item)) : [],
    selectionCustomized: raw.selectionCustomized === true,
    userId: raw.userId != null ? String(raw.userId) : undefined,
    residenceCountry: raw.residenceCountry != null ? String(raw.residenceCountry) : null,
    languages: strList(raw.languages),
    talents: raw.talents != null ? String(raw.talents) : null,
    talentSearchVisible: raw.talentSearchVisible === true,
    castingOffersEnabled: raw.castingOffersEnabled === true,
    ageBand: raw.ageBand != null ? String(raw.ageBand) : null,
    adultConfirmed: raw.adultConfirmed === true,
    birthDateSet: raw.birthDateSet === true,
    maxVideos: Number(raw.maxVideos ?? 50) || 50,
  }
}

function strList(v: unknown): string[] {
  return Array.isArray(v) ? v.map((x) => String(x ?? '').trim()).filter((x) => x.length > 0) : []
}

export function parseCareer(raw: Record<string, unknown>): ChannelCareer {
  return {
    id: String(raw.id ?? ''),
    category: String(raw.category ?? 'OTHER') as ChannelCareerCategory,
    title: String(raw.title ?? ''),
    organization: raw.organization != null ? String(raw.organization) : null,
    periodStart: raw.periodStart != null ? String(raw.periodStart) : null,
    periodEnd: raw.periodEnd != null ? String(raw.periodEnd) : null,
    description: raw.description != null ? String(raw.description) : null,
    visible: raw.visible !== false,
    sortOrder: Number(raw.sortOrder ?? 0) || 0,
  }
}

export type PublicChannelVideo = MyChannelVideoRow

/** GET /channels/public 리스트 항목 */
export type PublicChannelListItem = {
  userId: string
  nickname: string
  profileImage: string | null
  introText: string | null
  subscriberCount: number
  videoCount: number
  nationality?: string | null
  categories?: string[]
  shortBio?: string | null
  residenceCountry?: string | null
  mainField?: string | null
  totalViews?: number
  createdAt?: string | null
  lastActiveAt?: string | null
  featuredVideoId?: string | null
  featuredThumbnailUrl?: string | null
}

export type { ChannelListSort } from '../channel/discovery'
import type { ChannelListSort } from '../channel/discovery'

export type ChannelListParams = {
  q?: string
  country?: string
  category?: string
  field?: string
  sort?: ChannelListSort
  limit?: number
  offset?: number
}

export type PublicChannelResponse = {
  userId: string
  displayName: string
  name?: string | null
  nickname?: string | null
  introText?: string | null
  nationality?: string | null
  country?: string | null
  shortBio?: string | null
  bio?: string | null
  careerText?: string | null
  activityFields?: string[]
  categories?: string[]
  featuredVideoId?: string | null
  featuredVideo?: PublicChannelVideo | null
  subscribed?: boolean
  channelId?: string
  channelName?: string
  channelDescription?: string
  profileImageUrl?: string | null
  bannerImageUrl?: string | null
  videoCount?: number
  subscriberCount?: number
  viewCount?: number
  videos: PublicChannelVideo[]
  snsLinks?: SnsLinkRow[]
  residenceCountry?: string | null
  ageBand?: string | null
  languages?: string[]
  talents?: string | null
  mainField?: string | null
  careers?: ChannelCareer[]
  acceptsCastingOffers?: boolean
  canSendCastingOffer?: boolean
  lastActiveAt?: string | null
}

function parsePublicChannelListItem(raw: Record<string, unknown>): PublicChannelListItem {
  const prof =
    (raw.profileImage as string | null | undefined) ??
    (raw.profileImageUrl as string | null | undefined) ??
    null
  return {
    userId: String(raw.userId ?? ''),
    nickname: String(raw.nickname ?? ''),
    profileImage: prof != null && String(prof).trim() !== '' ? String(prof) : null,
    introText: raw.introText != null ? String(raw.introText) : null,
    subscriberCount: Number(raw.subscriberCount ?? 0) || 0,
    videoCount: Number(raw.videoCount ?? 0) || 0,
    nationality: raw.nationality != null ? String(raw.nationality) : null,
    categories: Array.isArray(raw.categories) ? raw.categories.map((item) => String(item)) : [],
    shortBio: raw.shortBio != null ? String(raw.shortBio) : null,
    residenceCountry: raw.residenceCountry != null ? String(raw.residenceCountry) : null,
    mainField: raw.mainField != null ? String(raw.mainField) : null,
    totalViews: Number(raw.totalViews ?? 0) || 0,
    createdAt: raw.createdAt != null ? String(raw.createdAt) : null,
    lastActiveAt: raw.lastActiveAt != null ? String(raw.lastActiveAt) : null,
    featuredVideoId: raw.featuredVideoId != null ? String(raw.featuredVideoId) : null,
    featuredThumbnailUrl: raw.featuredThumbnailUrl != null ? String(raw.featuredThumbnailUrl) : null,
  }
}

export const channelApi = {
  listPublic: async (params?: ChannelListParams): Promise<PublicChannelListItem[]> => {
    const clean = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'ALL'),
    )
    const { data } = await apiClient.get<unknown>('/channels/public', { params: clean })
    const unwrapped = unwrapData(data)
    if (!Array.isArray(unwrapped)) return []
    return unwrapped.map((x) => parsePublicChannelListItem(x as Record<string, unknown>))
  },

  listMyCareers: async (): Promise<ChannelCareer[]> => {
    const { data } = await apiClient.get<unknown>('/me/channel/careers')
    const rows = unwrapData(data)
    return Array.isArray(rows) ? rows.map((r) => parseCareer(r as Record<string, unknown>)) : []
  },

  createCareer: async (body: ChannelCareerInput): Promise<ChannelCareer> => {
    const { data } = await apiClient.post<unknown>('/me/channel/careers', body)
    return parseCareer(unwrapData(data) as Record<string, unknown>)
  },

  updateCareer: async (id: string, body: ChannelCareerInput): Promise<ChannelCareer> => {
    const { data } = await apiClient.patch<unknown>(`/me/channel/careers/${id}`, body)
    return parseCareer(unwrapData(data) as Record<string, unknown>)
  },

  deleteCareer: async (id: string): Promise<void> => {
    await apiClient.delete(`/me/channel/careers/${id}`)
  },

  getMine: async (): Promise<MyChannelSummary> => {
    const { data } = await apiClient.get<unknown>('/me/channel')
    return normalizeChannel(unwrapData(data) as Record<string, unknown>)
  },

  patchMine: async (body: PatchMyChannelBody): Promise<MyChannelSummary> => {
    const { data } = await apiClient.patch<unknown>('/me/channel', sanitizePatchMyChannelBody(body))
    return normalizeChannel(unwrapData(data) as Record<string, unknown>)
  },

  getPublic: async (userId: string): Promise<PublicChannelResponse> => {
    const { data } = await apiClient.get<unknown>(`/channels/${userId}`)
    const raw = unwrapData(data) as Record<string, unknown>
    const videos = normalizePublicChannelVideoListPayload(raw.videos)
    let featuredVideo: PublicChannelVideo | null = null
    if (raw.featuredVideo != null && typeof raw.featuredVideo === 'object') {
      featuredVideo = parseMyChannelVideoRow(raw.featuredVideo as Record<string, unknown>)
    }
    const snsRaw = raw.snsLinks
    let snsLinks: SnsLinkRow[] | undefined
    if (Array.isArray(snsRaw)) {
      snsLinks = snsRaw.map((x) => {
        const o = x as Record<string, unknown>
        return { platform: String(o.platform ?? ''), url: String(o.url ?? '') }
      })
    }
    const categories = Array.isArray(raw.categories)
      ? (raw.categories as unknown[]).map((x) => String(x ?? '').trim()).filter((s) => s.length > 0)
      : []
    return {
      userId: String(raw.userId ?? ''),
      displayName: String(raw.displayName ?? ''),
      name: raw.name != null ? String(raw.name) : null,
      nickname: raw.nickname != null ? String(raw.nickname) : null,
      introText: raw.introText != null ? String(raw.introText) : null,
      nationality: raw.nationality != null ? String(raw.nationality) : null,
      country: raw.country != null ? String(raw.country) : null,
      shortBio: raw.shortBio != null ? String(raw.shortBio) : null,
      bio: raw.bio != null ? String(raw.bio) : null,
      careerText: raw.careerText != null ? String(raw.careerText) : null,
      activityFields: Array.isArray(raw.activityFields)
        ? (raw.activityFields as unknown[]).map((item) => String(item ?? '').trim()).filter((item) => item.length > 0)
        : [],
      categories,
      featuredVideoId: raw.featuredVideoId != null ? String(raw.featuredVideoId) : null,
      featuredVideo,
      subscribed: typeof raw.subscribed === 'boolean' ? raw.subscribed : false,
      channelId: raw.channelId != null ? String(raw.channelId) : undefined,
      channelName: raw.channelName != null ? String(raw.channelName) : undefined,
      channelDescription: raw.channelDescription != null ? String(raw.channelDescription) : undefined,
      profileImageUrl: (raw.profileImageUrl as string | null | undefined) ?? null,
      bannerImageUrl: (raw.bannerImageUrl as string | null | undefined) ?? null,
      videoCount: raw.videoCount != null ? Number(raw.videoCount) : undefined,
      subscriberCount: raw.subscriberCount != null ? Number(raw.subscriberCount) : undefined,
      viewCount: raw.viewCount != null ? Number(raw.viewCount) : undefined,
      videos,
      snsLinks,
      residenceCountry: raw.residenceCountry != null ? String(raw.residenceCountry) : null,
      ageBand: raw.ageBand != null ? String(raw.ageBand) : null,
      languages: strList(raw.languages),
      talents: raw.talents != null ? String(raw.talents) : null,
      mainField: raw.mainField != null ? String(raw.mainField) : null,
      careers: Array.isArray(raw.careers) ? raw.careers.map((c) => parseCareer(c as Record<string, unknown>)) : [],
      acceptsCastingOffers: raw.acceptsCastingOffers === true,
      canSendCastingOffer: raw.canSendCastingOffer === true,
      lastActiveAt: raw.lastActiveAt != null ? String(raw.lastActiveAt) : null,
    }
  },
}
