import { apiClient } from './client'
import { MEDIA_ENDPOINTS } from './endpoints'
import type { PageResponse } from '../../types'

export interface VideoContent {
  id: number
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

  getVideo: async (id: number): Promise<VideoContent> => {
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
    // Gateway 경유 가능: /api/v1/videos
    const { data } = await apiClient.post(`${MEDIA_ENDPOINTS.VIDEOS}`, video)
    return data
  },

  likeVideo: async (id: number): Promise<VideoContent> => {
    // Gateway 경유 가능: /api/v1/videos/{id}/like
    const { data } = await apiClient.post(`${MEDIA_ENDPOINTS.VIDEOS}/${id}/like`)
    return data
  },

  updateVideo: async (
    id: number,
    video: {
      title?: string
      description?: string
      videoUrl?: string
      category?: string
      status?: string
    }
  ): Promise<VideoContent> => {
    // Gateway 경유 가능: /api/v1/videos/{id}
    const { data } = await apiClient.put(`${MEDIA_ENDPOINTS.VIDEOS}/${id}`, video)
    return data
  },

  deleteVideo: async (id: number): Promise<void> => {
    // Gateway 경유 가능: /api/v1/videos/{id}
    await apiClient.delete(`${MEDIA_ENDPOINTS.VIDEOS}/${id}`)
  },
}
