import { apiClient } from './client'
import type { Audition, PageResponse } from '@/types'

export const auditionApi = {
  // 오디션 목록 조회
  getAuditions: async (params?: {
    category?: string
    status?: string
    page?: number
    size?: number
  }): Promise<PageResponse<Audition>> => {
    const { data } = await apiClient.get('/auditions', { params })
    return data
  },

  // 오디션 상세 조회
  getAudition: async (id: number): Promise<Audition> => {
    const { data } = await apiClient.get(`/auditions/${id}`)
    return data
  },

  // 오디션 생성
  createAudition: async (audition: Partial<Audition>): Promise<Audition> => {
    const { data } = await apiClient.post('/auditions', audition)
    return data
  },

  // 오디션 수정
  updateAudition: async (
    id: number,
    audition: Partial<Audition>
  ): Promise<Audition> => {
    const { data } = await apiClient.put(`/auditions/${id}`, audition)
    return data
  },

  // 오디션 삭제
  deleteAudition: async (id: number): Promise<void> => {
    await apiClient.delete(`/auditions/${id}`)
  },

  // 기획사별 오디션 목록
  getAuditionsByBusiness: async (
    businessId: number,
    params?: { page?: number; size?: number }
  ): Promise<PageResponse<Audition>> => {
    const { data } = await apiClient.get(`/auditions/business/${businessId}`, {
      params,
    })
    return data
  },

  // 내 오디션 목록 (현재 로그인한 기획사의 오디션)
  getMyAuditions: async (params?: {
    page?: number
    size?: number
  }): Promise<PageResponse<Audition>> => {
    const { data } = await apiClient.get('/auditions/my', { params })
    return data
  },
}
