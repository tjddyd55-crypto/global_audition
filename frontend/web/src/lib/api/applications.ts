import { apiClient } from './client'
import type { Application, PageResponse, ScreeningResult } from '../../types'

export const applicationApi = {
  // 지원자 목록 조회 (오디션별, 필터링 지원)
  getApplicationsByAudition: async (
    auditionId: number,
    params?: {
      stage?: number // 0=전체, 1=1차합격, 2=2차합격, 3=최종합격
      status?: string
      page?: number
      size?: number
    }
  ): Promise<PageResponse<Application>> => {
    const { data } = await apiClient.get(`/applications/auditions/${auditionId}/applications`, {
      params,
    })
    return data
  },

  // 지원서 상세 조회
  getApplication: async (id: number): Promise<Application> => {
    const { data } = await apiClient.get(`/applications/${id}`)
    return data
  },

  // 지원서 목록 조회 (auditionId 또는 userId로)
  getApplications: async (params?: {
    auditionId?: number
    userId?: number
    page?: number
    size?: number
  }): Promise<PageResponse<Application>> => {
    const { data } = await apiClient.get('/applications', { params })
    return data
  },

  // 내 지원서 목록 (현재 로그인한 지원자의 지원서)
  getMyApplications: async (params?: {
    page?: number
    size?: number
  }): Promise<PageResponse<Application>> => {
    const { data } = await apiClient.get('/applications/my', { params })
    return data
  },

  // 지원자 합격 처리
  passApplication: async (
    id: number,
    stage: number, // 1, 2, 3
    message?: string
  ): Promise<Application> => {
    const { data } = await apiClient.put(`/applications/${id}/pass`, null, {
      params: { stage, message },
    })
    return data
  },

  // 지원자 불합격 처리
  failApplication: async (id: number, message?: string): Promise<Application> => {
    const { data } = await apiClient.put(`/applications/${id}/fail`, null, {
      params: { message },
    })
    return data
  },

  // 1차 심사 결과 업데이트
  updateResult1: async (
    id: number,
    result: ScreeningResult
  ): Promise<Application> => {
    const { data } = await apiClient.put(`/applications/${id}/result1`, { result })
    return data
  },

  // 2차 심사 결과 업데이트
  updateResult2: async (
    id: number,
    result: ScreeningResult
  ): Promise<Application> => {
    const { data } = await apiClient.put(`/applications/${id}/result2`, { result })
    return data
  },

  // 3차 심사 결과 업데이트
  updateResult3: async (
    id: number,
    result: ScreeningResult
  ): Promise<Application> => {
    const { data } = await apiClient.put(`/applications/${id}/result3`, { result })
    return data
  },

  // 최종 합격 결과 업데이트
  updateFinalResult: async (
    id: number,
    result: ScreeningResult
  ): Promise<Application> => {
    const { data } = await apiClient.put(`/applications/${id}/final-result`, { result })
    return data
  },

  // 1차 통과자 목록
  getFirstRoundPassed: async (auditionId: number): Promise<Application[]> => {
    const { data } = await apiClient.get(
      `/applications/auditions/${auditionId}/results/first-round`
    )
    return data
  },

  // 2차 통과자 목록
  getSecondRoundPassed: async (auditionId: number): Promise<Application[]> => {
    const { data } = await apiClient.get(
      `/applications/auditions/${auditionId}/results/second-round`
    )
    return data
  },

  // 3차 통과자 목록
  getThirdRoundPassed: async (auditionId: number): Promise<Application[]> => {
    const { data } = await apiClient.get(
      `/applications/auditions/${auditionId}/results/third-round`
    )
    return data
  },

  // 최종 합격자 목록
  getFinalPassed: async (auditionId: number): Promise<Application[]> => {
    const { data } = await apiClient.get(
      `/applications/auditions/${auditionId}/results/final`
    )
    return data
  },
}
