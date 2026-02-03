import { apiClient } from './client'
import type { PageResponse } from '../../types'

export type CreativeAsset = {
  id: number
  userId: number
  title: string
  description?: string
  assetType: 'LYRIC' | 'COMPOSITION' | 'DEMO_AUDIO' | 'VOCAL_GUIDE' | 'STEMS' | 'AI_GENERATED' | 'AI_ASSISTED'
  fileUrl?: string
  textContent?: string
  contentHash: string
  fileSize?: number
  mimeType?: string
  declaredCreationType?: string
  accessControl: 'PUBLIC' | 'AUDITION_ONLY' | 'PRIVATE'
  registeredAt: string
  createdAt: string
  updatedAt?: string
}

export const vaultApi = {
  // 창작물 자산 등록
  createAsset: async (params: {
    file?: File
    textContent?: string
    title: string
    description?: string
    assetType: string
    declaredCreationType?: string
    accessControl: string
  }): Promise<CreativeAsset> => {
    const formData = new FormData()
    if (params.file) {
      formData.append('file', params.file)
    }
    if (params.textContent) {
      formData.append('textContent', params.textContent)
    }
    formData.append('title', params.title)
    if (params.description) formData.append('description', params.description)
    formData.append('assetType', params.assetType)
    if (params.declaredCreationType) formData.append('declaredCreationType', params.declaredCreationType)
    formData.append('accessControl', params.accessControl)

    const { data } = await apiClient.post('/vault/assets', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return data
  },

  // 내 창작물 목록 조회
  getMyAssets: async (params?: {
    page?: number
    size?: number
  }): Promise<PageResponse<CreativeAsset>> => {
    const { data } = await apiClient.get('/vault/assets/my', { params })
    return data
  },

  // 창작물 상세 조회
  getAsset: async (id: number): Promise<CreativeAsset> => {
    const { data } = await apiClient.get(`/vault/assets/${id}`)
    return data
  },

  // asset_id 목록으로 조회
  getAssetsByIds: async (assetIds: number[]): Promise<CreativeAsset[]> => {
    const { data } = await apiClient.post('/vault/assets/batch', assetIds)
    return data
  },
}
