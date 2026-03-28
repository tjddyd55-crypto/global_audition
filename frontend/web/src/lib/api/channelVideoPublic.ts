import { apiClient } from './client'
import { unwrapData } from './unwrap'
import type { MyChannelVideoRow } from './videos'

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

export type ChannelVideoViewBumpResult = {
  counted: boolean
  viewCount: number
}

/** 백엔드 MyChannelVideoDto / 채널 응답 JSON을 리스트 행으로 통일 (필드 누락·타입 방어) */
export function parseMyChannelVideoRow(raw: Record<string, unknown>): MyChannelVideoRow {
  const created = raw.createdAt
  let createdAt = ''
  if (created != null) {
    if (typeof created === 'string') {
      createdAt = created
    } else if (typeof created === 'number') {
      createdAt = new Date(created).toISOString()
    } else if (typeof created === 'object' && created !== null) {
      const o = created as Record<string, unknown>
      if (typeof o.epochSecond === 'number') {
        const sec = o.epochSecond as number
        const nano = typeof o.nano === 'number' ? (o.nano as number) : 0
        createdAt = new Date(sec * 1000 + nano / 1e6).toISOString()
      }
    }
  }
  return {
    videoId: String(raw.videoId ?? raw.id ?? ''),
    title: String(raw.title ?? ''),
    videoUrl: String(raw.videoUrl ?? ''),
    description: raw.description != null ? String(raw.description) : null,
    category: raw.category != null ? String(raw.category) : null,
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    visibility: String(raw.visibility ?? 'PUBLIC'),
    viewCount: Number(raw.viewCount ?? 0) || 0,
    likeCount: Number(raw.likeCount ?? 0) || 0,
    createdAt,
  }
}

export function normalizePublicChannelVideoListPayload(raw: unknown): MyChannelVideoRow[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((x) => parseMyChannelVideoRow(x as Record<string, unknown>))
    .filter((row) => row.videoId.trim() !== '')
}

/** GET /videos/public?channelOwnerId= — 공개 채널의 PUBLIC 영상만, 최신순 */
export async function listPublicVideosForChannel(channelOwnerId: string): Promise<MyChannelVideoRow[]> {
  const { data } = await apiClient.get<unknown>('/videos/public', {
    params: { channelOwnerId },
  })
  const body = unwrapData<unknown>(data)
  if (Array.isArray(body)) {
    return normalizePublicChannelVideoListPayload(body)
  }
  if (body && typeof body === 'object' && Array.isArray((body as { items?: unknown }).items)) {
    return normalizePublicChannelVideoListPayload((body as { items: unknown[] }).items)
  }
  return []
}

export async function fetchChannelVideoPublic(videoId: string): Promise<ChannelVideoPublicDetail> {
  const { data } = await apiClient.get<unknown>(`/videos/${videoId}/public`)
  const raw = unwrapData<Record<string, unknown>>(data)
  return parsePublicDetail(raw)
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

export async function bumpChannelVideoView(videoId: string): Promise<ChannelVideoViewBumpResult> {
  const { data } = await apiClient.post<unknown>(`/videos/${videoId}/view`)
  const raw = unwrapData<Record<string, unknown>>(data)
  return {
    counted: Boolean(raw.counted),
    viewCount: Number(raw.viewCount ?? 0) || 0,
  }
}

export async function listChannelVideosByCategory(category: string, excludeVideoId: string): Promise<ChannelVideoRecommendItem[]> {
  const { data } = await apiClient.get<unknown>('/videos', {
    params: { category, exclude: excludeVideoId },
  })
  const arr = unwrapData<unknown[]>(data)
  if (!Array.isArray(arr)) return []
  return arr.map((x) => {
    const r = x as Record<string, unknown>
    return {
      videoId: String(r.videoId ?? ''),
      title: String(r.title ?? ''),
      thumbnailUrl: r.thumbnailUrl != null ? String(r.thumbnailUrl) : null,
      channelDisplayName: String(r.channelDisplayName ?? ''),
      viewCount: Number(r.viewCount ?? 0) || 0,
      publishedAt: String(r.publishedAt ?? ''),
    }
  })
}

export async function listChannelVideoComments(videoId: string): Promise<ChannelVideoCommentRow[]> {
  const { data } = await apiClient.get<unknown>(`/videos/${videoId}/comments`)
  const arr = unwrapData<unknown[]>(data)
  if (!Array.isArray(arr)) return []
  return arr.map((x) => {
    const r = x as Record<string, unknown>
    return {
      id: String(r.id ?? ''),
      authorDisplayName: String(r.authorDisplayName ?? ''),
      authorProfileImageUrl: r.authorProfileImageUrl != null ? String(r.authorProfileImageUrl) : null,
      content: String(r.content ?? ''),
      createdAt: String(r.createdAt ?? ''),
    }
  })
}

export async function postChannelVideoComment(videoId: string, content: string): Promise<ChannelVideoCommentRow> {
  const { data } = await apiClient.post<unknown>(`/videos/${videoId}/comments`, { content })
  const raw = unwrapData<Record<string, unknown>>(data)
  return {
    id: String(raw.id ?? ''),
    authorDisplayName: String(raw.authorDisplayName ?? ''),
    authorProfileImageUrl: raw.authorProfileImageUrl != null ? String(raw.authorProfileImageUrl) : null,
    content: String(raw.content ?? ''),
    createdAt: String(raw.createdAt ?? ''),
  }
}

export async function postChannelVideoLike(videoId: string): Promise<ChannelVideoReactionResult> {
  const { data } = await apiClient.post<unknown>(`/videos/${videoId}/like`)
  const raw = unwrapData<Record<string, unknown>>(data)
  return parseReaction(raw)
}

export async function postChannelVideoDislike(videoId: string): Promise<ChannelVideoReactionResult> {
  const { data } = await apiClient.post<unknown>(`/videos/${videoId}/dislike`)
  const raw = unwrapData<Record<string, unknown>>(data)
  return parseReaction(raw)
}

function parseReaction(raw: Record<string, unknown>): ChannelVideoReactionResult {
  return {
    likeCount: Number(raw.likeCount ?? 0) || 0,
    dislikeCount: Number(raw.dislikeCount ?? 0) || 0,
    liked: Boolean(raw.liked),
    disliked: Boolean(raw.disliked),
  }
}

export async function postChannelSubscribe(channelOwnerId: string): Promise<ChannelSubscribeState> {
  const { data } = await apiClient.post<unknown>('/subscribe', { channelOwnerId })
  const raw = unwrapData<Record<string, unknown>>(data)
  return parseSubscribeState(raw)
}

export async function deleteChannelSubscribe(channelOwnerId: string): Promise<ChannelSubscribeState> {
  const { data } = await apiClient.delete<unknown>('/subscribe', { data: { channelOwnerId } })
  const raw = unwrapData<Record<string, unknown>>(data)
  return parseSubscribeState(raw)
}

function parseSubscribeState(raw: Record<string, unknown>): ChannelSubscribeState {
  return {
    subscribed: Boolean(raw.subscribed),
    subscriberCount: Number(raw.subscriberCount ?? 0) || 0,
  }
}
