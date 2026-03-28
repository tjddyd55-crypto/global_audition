import { apiClient } from './client'
import { normalizePublicChannelVideoListPayload } from './channelVideoPublic'
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
  snsLinks?: SnsLinkRow[]
}

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
    snsLinks,
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
}

export type PublicChannelResponse = {
  userId: string
  displayName: string
  name?: string | null
  nickname?: string | null
  introText?: string | null
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
  }
}

export const channelApi = {
  listPublic: async (): Promise<PublicChannelListItem[]> => {
    const { data } = await apiClient.get<unknown>('/channels/public')
    const unwrapped = unwrapData(data)
    if (!Array.isArray(unwrapped)) return []
    return unwrapped.map((x) => parsePublicChannelListItem(x as Record<string, unknown>))
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
    const snsRaw = raw.snsLinks
    let snsLinks: SnsLinkRow[] | undefined
    if (Array.isArray(snsRaw)) {
      snsLinks = snsRaw.map((x) => {
        const o = x as Record<string, unknown>
        return { platform: String(o.platform ?? ''), url: String(o.url ?? '') }
      })
    }
    return {
      userId: String(raw.userId ?? ''),
      displayName: String(raw.displayName ?? ''),
      name: raw.name != null ? String(raw.name) : null,
      nickname: raw.nickname != null ? String(raw.nickname) : null,
      introText: raw.introText != null ? String(raw.introText) : null,
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
    }
  },
}
