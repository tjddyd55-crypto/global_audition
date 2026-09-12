import { unwrapData } from './unwrap'
import { apiRequest } from './http'

export type PublicChannelListItem = {
  userId: string
  nickname: string
  profileImage: string | null
  introText: string | null
  subscriberCount: number
  videoCount: number
}

export type PublicChannelVideo = {
  videoId: string
  title: string
  videoUrl: string
  thumbnailUrl: string | null
  viewCount: number
  likeCount: number
  category: string | null
  createdAt: string
}

export type PublicChannelResponse = {
  userId: string
  displayName: string
  introText: string | null
  nationality: string | null
  profileImageUrl: string | null
  subscriberCount: number
  videoCount: number
  viewCount: number
  subscribed: boolean
  categories: string[]
  videos: PublicChannelVideo[]
  featuredVideo: PublicChannelVideo | null
}

function parseVideo(raw: Record<string, unknown>): PublicChannelVideo {
  return {
    videoId: String(raw.videoId ?? raw.id ?? ''),
    title: String(raw.title ?? ''),
    videoUrl: String(raw.videoUrl ?? ''),
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    viewCount: Number(raw.viewCount ?? 0) || 0,
    likeCount: Number(raw.likeCount ?? 0) || 0,
    category: raw.category != null ? String(raw.category) : null,
    createdAt: String(raw.createdAt ?? ''),
  }
}

function parseListItem(raw: Record<string, unknown>): PublicChannelListItem {
  const prof = (raw.profileImage as string | null | undefined) ?? (raw.profileImageUrl as string | null | undefined) ?? null
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
    const data = unwrapData(await apiRequest<unknown>('/channels/public', { auth: false }))
    if (!Array.isArray(data)) return []
    return data.map((row) => parseListItem(row as Record<string, unknown>)).filter((row) => row.userId.trim() !== '')
  },

  getPublic: async (userId: string): Promise<PublicChannelResponse> => {
    const raw = unwrapData(await apiRequest<unknown>(`/channels/${userId}`, { auth: false })) as Record<string, unknown>
    const videosRaw = Array.isArray(raw.videos) ? raw.videos : []
    let featuredVideo: PublicChannelVideo | null = null
    if (raw.featuredVideo != null && typeof raw.featuredVideo === 'object') {
      featuredVideo = parseVideo(raw.featuredVideo as Record<string, unknown>)
    }
    const categories = Array.isArray(raw.categories)
      ? (raw.categories as unknown[]).map((x) => String(x ?? '').trim()).filter((s) => s.length > 0)
      : []
    return {
      userId: String(raw.userId ?? ''),
      displayName: String(raw.displayName ?? ''),
      introText: raw.introText != null ? String(raw.introText) : null,
      nationality: raw.nationality != null ? String(raw.nationality) : null,
      profileImageUrl: raw.profileImageUrl != null ? String(raw.profileImageUrl) : null,
      subscriberCount: Number(raw.subscriberCount ?? 0) || 0,
      videoCount: Number(raw.videoCount ?? 0) || 0,
      viewCount: Number(raw.viewCount ?? 0) || 0,
      subscribed: Boolean(raw.subscribed),
      categories,
      videos: videosRaw.map((row) => parseVideo(row as Record<string, unknown>)).filter((row) => row.videoId.trim() !== ''),
      featuredVideo,
    }
  },
}
