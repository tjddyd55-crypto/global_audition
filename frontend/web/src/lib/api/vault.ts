import { apiClient } from './client'
import { unwrapData } from './unwrap'
import type { PageResponse } from '../../types'

export type CreativeAsset = {
  id: string
  userId: number
  title: string
  description?: string
  assetType: string
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

type VaultItemDetail = {
  vaultItemId: string
  title: string
  description?: string | null
  type: string
  visibility: string
  creationMethod: string
  createdAt: string
  fileUrl?: string | null
  audioUrl?: string | null
  videoUrl?: string | null
}

function mapVaultToCreative(v: VaultItemDetail): CreativeAsset {
  const created = typeof v.createdAt === 'string' ? v.createdAt : String(v.createdAt)
  const vis = v.visibility as CreativeAsset['accessControl']
  return {
    id: v.vaultItemId,
    userId: 0,
    title: v.title,
    description: v.description ?? undefined,
    assetType: v.type,
    fileUrl: v.fileUrl ?? undefined,
    textContent: undefined,
    contentHash: 'vault',
    declaredCreationType: v.creationMethod,
    accessControl: vis === 'PUBLIC' || vis === 'AUDITION_ONLY' || vis === 'PRIVATE' ? vis : 'PRIVATE',
    registeredAt: created,
    createdAt: created,
    updatedAt: created,
  }
}

export const vaultApi = {
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

    const { data } = await apiClient.post<unknown>('/me/vault', formData)
    const d = unwrapData<VaultItemDetail>(data)
    return mapVaultToCreative(d)
  },

  getMyAssets: async (params?: { page?: number; size?: number }): Promise<PageResponse<CreativeAsset>> => {
    const { data } = await apiClient.get<unknown>('/me/vault', { params })
    const page = unwrapData<{ items: VaultItemDetail[]; total: number }>(data)
    const items = (page.items ?? []).map((row) => {
      const r = row as VaultItemDetail
      return mapVaultToCreative({
        vaultItemId: r.vaultItemId,
        title: r.title,
        description: r.description ?? null,
        type: r.type,
        visibility: r.visibility,
        creationMethod: r.creationMethod,
        createdAt: r.createdAt as string,
        fileUrl: r.fileUrl ?? null,
        audioUrl: r.audioUrl ?? null,
        videoUrl: r.videoUrl ?? null,
      })
    })
    return {
      content: items,
      totalElements: page.total ?? items.length,
      totalPages: 1,
      page: params?.page ?? 0,
      size: items.length,
    }
  },

  getAsset: async (id: string): Promise<CreativeAsset> => {
    const { data } = await apiClient.get<unknown>(`/me/vault/${id}`)
    const d = unwrapData<VaultItemDetail>(data)
    return mapVaultToCreative(d)
  },

  getAssetsByIds: async (assetIds: string[]): Promise<CreativeAsset[]> => {
    const results = await Promise.all(assetIds.map((id) => vaultApi.getAsset(id).catch(() => null)))
    return results.filter((x): x is CreativeAsset => x != null)
  },
}
