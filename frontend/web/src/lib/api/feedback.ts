import { apiClient } from './client'
import type { PageResponse } from '../../types'

export type ExpertFeedback = {
  id: number
  assetId: number
  evaluatorId: number
  evaluatorName?: string
  evaluatorType: 'AGENCY' | 'CERTIFIED_EVALUATOR'
  rating?: number
  comment?: string
  evidenceLink?: string
  isPublic?: boolean
  createdAt: string
  updatedAt?: string
}

export const feedbackApi = {
  // 전문가 평가 작성
  createFeedback: async (request: {
    assetId: number
    rating?: number
    comment?: string
    evidenceLink?: string
  }): Promise<ExpertFeedback> => {
    const { data } = await apiClient.post('/feedback', request)
    return data
  },

  // 자산별 평가 목록 조회
  getFeedbackByAsset: async (
    assetId: number,
    params?: { page?: number; size?: number }
  ): Promise<PageResponse<ExpertFeedback>> => {
    const { data } = await apiClient.get(`/feedback/asset/${assetId}`, { params })
    return data
  },

  // 내가 작성한 평가 목록
  getMyFeedback: async (params?: {
    page?: number
    size?: number
  }): Promise<PageResponse<ExpertFeedback>> => {
    const { data } = await apiClient.get('/feedback/my', { params })
    return data
  },
}
