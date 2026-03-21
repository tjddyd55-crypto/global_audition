import { apiClient } from './client'
import { MEDIA_ENDPOINTS } from './endpoints'
import { unwrapData } from './unwrap'
import type { PageResponse } from '../../types'

export interface VideoContent {
  id: string
  userId: number
  userName?: string
  title: string
  description?: string
  videoUrl: string
  embedUrl?: string // YouTube 임베드 URL
  thumbnailUrl?: string
  duration?: number
  viewCount: number
  likeCount: number
  commentCount: number
  category?: string
  status: string
  createdAt: string
  updatedAt: string
}

function mapMeChannelVideoRow(v: {
  videoId: string
  title: string
  videoUrl: string
  description?: string | null
  category?: string | null
  thumbnailUrl?: string | null
  visibility: string
  viewCount: number
  likeCount: number
  createdAt: string
}): VideoContent {
  const created = typeof v.createdAt === 'string' ? v.createdAt : String(v.createdAt)
  const pub = v.visibility === 'PUBLIC'
  return {
    id: v.videoId,
    userId: 0,
    title: v.title,
    description: v.description ?? undefined,
    videoUrl: v.videoUrl ?? '',
    thumbnailUrl: v.thumbnailUrl ?? undefined,
    duration: undefined,
    viewCount: v.viewCount ?? 0,
    likeCount: v.likeCount ?? 0,
    commentCount: 0,
    category: v.category ?? undefined,
    status: pub ? 'PUBLISHED' : 'PRIVATE',
    createdAt: created,
    updatedAt: created,
  }
}

function visibilityFromFormStatus(status: string): 'PUBLIC' | 'PRIVATE' {
  return status === 'PUBLISHED' ? 'PUBLIC' : 'PRIVATE'
}

/**
 * Videos API
 * 
 * Gateway 경유 구조:
 * - 현재: Gateway 라우팅 설정됨 (/api/v1/videos/**)
 * - 엔드포인트: MEDIA_ENDPOINTS.VIDEOS 사용
 * - Gateway 전환 가능: USE_GATEWAY.VIDEOS = true
 */
export const videoApi = {
  getVideos: async (params?: {
    userId?: number
    sort?: string
    page?: number
    size?: number
  }): Promise<PageResponse<VideoContent>> => {
    // Gateway 경유 가능: /api/v1/videos
    const { data } = await apiClient.get(`${MEDIA_ENDPOINTS.VIDEOS}`, { params })
    return data
  },

  getMyChannelVideos: async (): Promise<PageResponse<VideoContent>> => {
    const { data } = await apiClient.get<unknown>('/me/channel/videos')
    const p = unwrapData<{ items: Parameters<typeof mapMeChannelVideoRow>[0][]; total: number }>(data)
    const items = (p.items ?? []).map(mapMeChannelVideoRow)
    return {
      content: items,
      totalElements: p.total ?? items.length,
      totalPages: 1,
      page: 0,
      size: items.length,
    }
  },

  getVideo: async (id: string): Promise<VideoContent> => {
    // Gateway 경유 가능: /api/v1/videos/{id}
    const { data } = await apiClient.get(`${MEDIA_ENDPOINTS.VIDEOS}/${id}`)
    return data
  },

  createVideo: async (video: {
    title: string
    description?: string
    videoUrl: string
    category?: string
    status: string
  }): Promise<VideoContent> => {
    const { data } = await apiClient.post<unknown>('/me/channel/videos', {
      title: video.title,
      description: video.description,
      videoUrl: video.videoUrl,
      category: video.category,
      visibility: visibilityFromFormStatus(video.status),
    })
    const row = unwrapData<Parameters<typeof mapMeChannelVideoRow>[0]>(data)
    return mapMeChannelVideoRow(row)
  },

  likeVideo: async (id: string): Promise<VideoContent> => {
    // Gateway 경유 가능: /api/v1/videos/{id}/like
    const { data } = await apiClient.post(`${MEDIA_ENDPOINTS.VIDEOS}/${id}/like`)
    return data
  },

  updateVideo: async (
    id: string,
    video: {
      title?: string
      description?: string
      videoUrl?: string
      category?: string
      status?: string
    }
  ): Promise<VideoContent> => {
    const body: Record<string, unknown> = {}
    if (video.title != null) body.title = video.title
    if (video.description != null) body.description = video.description
    if (video.videoUrl != null) body.videoUrl = video.videoUrl
    if (video.category != null) body.category = video.category
    if (video.status != null) body.visibility = visibilityFromFormStatus(video.status)
    const { data } = await apiClient.patch<unknown>(`/me/channel/videos/${id}`, body)
    const row = unwrapData<Parameters<typeof mapMeChannelVideoRow>[0]>(data)
    return mapMeChannelVideoRow(row)
  },

  deleteVideo: async (id: string): Promise<void> => {
    await apiClient.delete(`/me/channel/videos/${id}`)
  },
}
