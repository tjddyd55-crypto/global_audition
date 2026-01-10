import { apiClient } from './client'
import type { PageResponse } from '@/types'

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

export const videoApi = {
  getVideos: async (params?: {
    userId?: number
    sort?: string
    page?: number
    size?: number
  }): Promise<PageResponse<VideoContent>> => {
    const { data } = await apiClient.get('/videos', { params })
    return data
  },

  getVideo: async (id: number): Promise<VideoContent> => {
    const { data } = await apiClient.get(`/videos/${id}`)
    return data
  },

  createVideo: async (video: {
    title: string
    description?: string
    videoUrl: string
    category?: string
    status: string
  }): Promise<VideoContent> => {
    const { data } = await apiClient.post('/videos', video)
    return data
  },

  likeVideo: async (id: number): Promise<VideoContent> => {
    const { data } = await apiClient.post(`/videos/${id}/like`)
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
    const { data } = await apiClient.put(`/videos/${id}`, video)
    return data
  },

  deleteVideo: async (id: number): Promise<void> => {
    await apiClient.delete(`/videos/${id}`)
  },
}
