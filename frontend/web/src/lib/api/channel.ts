import { apiClient } from './client'
import { unwrapData } from './unwrap'
import type { MyChannelVideoRow } from './videos'

export type { MyChannelVideoRow }

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
  /** 스펙 필드명 */
  is_channel_public?: boolean
  isPublic?: boolean
  snsLinks?: SnsLinkRow[]
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

export const channelApi = {
  getMine: async (): Promise<MyChannelSummary> => {
    const { data } = await apiClient.get<unknown>('/me/channel')
    return normalizeChannel(unwrapData(data) as Record<string, unknown>)
  },

  patchMine: async (body: PatchMyChannelBody): Promise<MyChannelSummary> => {
    const { data } = await apiClient.patch<unknown>('/me/channel', body)
    return normalizeChannel(unwrapData(data) as Record<string, unknown>)
  },

  getPublic: async (userId: string): Promise<PublicChannelResponse> => {
    const { data } = await apiClient.get<unknown>(`/channels/${userId}`)
    const raw = unwrapData(data) as Record<string, unknown>
    const videos = (Array.isArray(raw.videos) ? raw.videos : []) as PublicChannelVideo[]
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
