import { apiClient } from './client'
import { unwrapData } from './unwrap'
import type { MyChannelVideoRow } from './videos'

export type { MyChannelVideoRow }

export type MyChannelSummary = {
  channelId: string
  channelName: string
  channelDescription?: string
  profileImageUrl?: string | null
  bannerImageUrl?: string | null
  videoCount: number
  subscriberCount: number
  viewCount: number
  /** JSON: isPublic */
  channelPublic?: boolean
}

function normalizeChannel(raw: Record<string, unknown>): MyChannelSummary {
  const isPublic =
    typeof raw.channelPublic === 'boolean'
      ? raw.channelPublic
      : typeof raw.isPublic === 'boolean'
        ? raw.isPublic
        : false
  return {
    channelId: String(raw.channelId ?? ''),
    channelName: String(raw.channelName ?? ''),
    channelDescription: raw.channelDescription != null ? String(raw.channelDescription) : undefined,
    profileImageUrl: (raw.profileImageUrl as string | null | undefined) ?? null,
    bannerImageUrl: (raw.bannerImageUrl as string | null | undefined) ?? null,
    videoCount: Number(raw.videoCount ?? 0),
    subscriberCount: Number(raw.subscriberCount ?? 0),
    viewCount: Number(raw.viewCount ?? 0),
    channelPublic: isPublic,
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
}

export const channelApi = {
  getMine: async (): Promise<MyChannelSummary> => {
    const { data } = await apiClient.get<unknown>('/me/channel')
    return normalizeChannel(unwrapData(data) as Record<string, unknown>)
  },

  patchMine: async (body: { isPublic?: boolean } & Record<string, unknown>): Promise<MyChannelSummary> => {
    const { data } = await apiClient.patch<unknown>('/me/channel', body)
    return normalizeChannel(unwrapData(data) as Record<string, unknown>)
  },

  getPublic: async (userId: string): Promise<PublicChannelResponse> => {
    const { data } = await apiClient.get<unknown>(`/channels/${userId}`)
    const raw = unwrapData(data) as Record<string, unknown>
    const videos = (Array.isArray(raw.videos) ? raw.videos : []) as PublicChannelVideo[]
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
    }
  },
}
