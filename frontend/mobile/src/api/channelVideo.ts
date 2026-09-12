import { unwrapData } from './unwrap'
import { apiRequest } from './http'

export type ChannelVideoBrowseItem = {
  videoId: string
  title: string
  videoUrl: string
  thumbnailUrl: string | null
  category: string
  channelDisplayName: string
  channelProfileImageUrl: string | null
  channelOwnerId?: string
  viewCount: number
  likeCount: number
  publishedAt: string
}

export type ChannelVideoPublicDetail = {
  videoId: string
  title: string
  videoUrl: string
  thumbnailUrl: string | null
  description: string
  category: string
  viewCount: number
  likeCount: number
  dislikeCount: number
  publishedAt: string
  channelOwnerId: string
  channelDisplayName: string
  channelProfileImageUrl: string | null
  subscriberCount: number
  subscribed: boolean
  liked: boolean
  disliked: boolean
}

export type ChannelVideoCommentRow = {
  id: string
  authorDisplayName: string
  authorProfileImageUrl: string | null
  content: string
  createdAt: string
}

export type ChannelVideoReactionResult = {
  likeCount: number
  dislikeCount: number
  liked: boolean
  disliked: boolean
}

export type ChannelVideoRecommendItem = {
  videoId: string
  title: string
  thumbnailUrl: string | null
  channelDisplayName: string
  viewCount: number
  publishedAt: string
}

export type ChannelSubscribeState = {
  subscribed: boolean
  subscriberCount: number
}

function parseBrowseItem(raw: Record<string, unknown>): ChannelVideoBrowseItem {
  return {
    videoId: String(raw.videoId ?? ''),
    title: String(raw.title ?? ''),
    videoUrl: String(raw.videoUrl ?? ''),
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    category: String(raw.category ?? ''),
    channelDisplayName: String(raw.channelDisplayName ?? ''),
    channelProfileImageUrl: raw.channelProfileImageUrl != null ? String(raw.channelProfileImageUrl) : null,
    channelOwnerId: raw.channelOwnerId != null ? String(raw.channelOwnerId) : undefined,
    viewCount: Number(raw.viewCount ?? 0) || 0,
    likeCount: Number(raw.likeCount ?? 0) || 0,
    publishedAt: String(raw.publishedAt ?? ''),
  }
}

function parsePublicDetail(raw: Record<string, unknown>): ChannelVideoPublicDetail {
  return {
    videoId: String(raw.videoId ?? ''),
    title: String(raw.title ?? ''),
    videoUrl: String(raw.videoUrl ?? ''),
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    description: String(raw.description ?? ''),
    category: String(raw.category ?? ''),
    viewCount: Number(raw.viewCount ?? 0) || 0,
    likeCount: Number(raw.likeCount ?? 0) || 0,
    dislikeCount: Number(raw.dislikeCount ?? 0) || 0,
    publishedAt: String(raw.publishedAt ?? ''),
    channelOwnerId: String(raw.channelOwnerId ?? ''),
    channelDisplayName: String(raw.channelDisplayName ?? ''),
    channelProfileImageUrl: raw.channelProfileImageUrl != null ? String(raw.channelProfileImageUrl) : null,
    subscriberCount: Number(raw.subscriberCount ?? 0) || 0,
    subscribed: Boolean(raw.subscribed),
    liked: Boolean(raw.liked),
    disliked: Boolean(raw.disliked),
  }
}

function parseReaction(raw: Record<string, unknown>): ChannelVideoReactionResult {
  return {
    likeCount: Number(raw.likeCount ?? 0) || 0,
    dislikeCount: Number(raw.dislikeCount ?? 0) || 0,
    liked: Boolean(raw.liked),
    disliked: Boolean(raw.disliked),
  }
}

export const channelVideoApi = {
  listBrowse: async (category?: string): Promise<ChannelVideoBrowseItem[]> => {
    const data = unwrapData(
      await apiRequest<unknown>('/videos/browse', {
        query: category && category !== '전체 카테고리' ? { category } : undefined,
        auth: false,
      }),
    )
    if (!Array.isArray(data)) return []
    return data
      .map((row) => parseBrowseItem(row as Record<string, unknown>))
      .filter((row) => row.videoId.trim() !== '')
  },

  getPublic: async (videoId: string): Promise<ChannelVideoPublicDetail> =>
    parsePublicDetail(unwrapData(await apiRequest<unknown>(`/videos/${videoId}/public`, { auth: false })) as Record<string, unknown>),

  bumpView: async (videoId: string): Promise<{ counted: boolean; viewCount: number }> => {
    const raw = unwrapData(await apiRequest<unknown>(`/videos/${videoId}/view`, { method: 'POST', auth: false })) as Record<string, unknown>
    return { counted: Boolean(raw.counted), viewCount: Number(raw.viewCount ?? 0) || 0 }
  },

  listComments: async (videoId: string): Promise<ChannelVideoCommentRow[]> => {
    const data = unwrapData(await apiRequest<unknown>(`/videos/${videoId}/comments`, { auth: false }))
    if (!Array.isArray(data)) return []
    return data.map((row) => {
      const r = row as Record<string, unknown>
      return {
        id: String(r.id ?? ''),
        authorDisplayName: String(r.authorDisplayName ?? ''),
        authorProfileImageUrl: r.authorProfileImageUrl != null ? String(r.authorProfileImageUrl) : null,
        content: String(r.content ?? ''),
        createdAt: String(r.createdAt ?? ''),
      }
    })
  },

  postComment: async (videoId: string, content: string): Promise<ChannelVideoCommentRow> => {
    const raw = unwrapData(
      await apiRequest<unknown>(`/videos/${videoId}/comments`, { method: 'POST', body: { content } }),
    ) as Record<string, unknown>
    return {
      id: String(raw.id ?? ''),
      authorDisplayName: String(raw.authorDisplayName ?? ''),
      authorProfileImageUrl: raw.authorProfileImageUrl != null ? String(raw.authorProfileImageUrl) : null,
      content: String(raw.content ?? ''),
      createdAt: String(raw.createdAt ?? ''),
    }
  },

  like: async (videoId: string): Promise<ChannelVideoReactionResult> =>
    parseReaction(unwrapData(await apiRequest<unknown>(`/videos/${videoId}/like`, { method: 'POST' })) as Record<string, unknown>),

  dislike: async (videoId: string): Promise<ChannelVideoReactionResult> =>
    parseReaction(unwrapData(await apiRequest<unknown>(`/videos/${videoId}/dislike`, { method: 'POST' })) as Record<string, unknown>),

  listRecommendations: async (category: string, excludeVideoId: string): Promise<ChannelVideoRecommendItem[]> => {
    const data = unwrapData(
      await apiRequest<unknown>('/videos', { query: { category, exclude: excludeVideoId }, auth: false }),
    )
    if (!Array.isArray(data)) return []
    return data.map((row) => {
      const r = row as Record<string, unknown>
      return {
        videoId: String(r.videoId ?? ''),
        title: String(r.title ?? ''),
        thumbnailUrl: r.thumbnailUrl != null ? String(r.thumbnailUrl) : null,
        channelDisplayName: String(r.channelDisplayName ?? ''),
        viewCount: Number(r.viewCount ?? 0) || 0,
        publishedAt: String(r.publishedAt ?? ''),
      }
    })
  },

  subscribe: async (channelOwnerId: string): Promise<ChannelSubscribeState> => {
    const raw = unwrapData(await apiRequest<unknown>('/subscribe', { method: 'POST', body: { channelOwnerId } })) as Record<string, unknown>
    return { subscribed: Boolean(raw.subscribed), subscriberCount: Number(raw.subscriberCount ?? 0) || 0 }
  },

  unsubscribe: async (channelOwnerId: string): Promise<ChannelSubscribeState> => {
    const raw = unwrapData(
      await apiRequest<unknown>('/subscribe', { method: 'DELETE', body: { channelOwnerId } }),
    ) as Record<string, unknown>
    return { subscribed: Boolean(raw.subscribed), subscriberCount: Number(raw.subscriberCount ?? 0) || 0 }
  },
}
