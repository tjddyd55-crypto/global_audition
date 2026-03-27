import { apiClient } from './client'

export type TagRow = {
  id: string
  name: string
  type: string
  active: boolean
}

/** 공개 카탈로그 — 활성 태그만 */
export async function fetchTagCatalog(): Promise<TagRow[]> {
  const { data } = await apiClient.get<TagRow[]>('/tags')
  return data ?? []
}

export const superAdminTagApi = {
  list: async (): Promise<TagRow[]> => {
    const { data } = await apiClient.get<TagRow[]>('/admin/tags')
    return data ?? []
  },
  create: async (body: { name: string; type: 'SYSTEM' | 'USER' }): Promise<TagRow> => {
    const { data } = await apiClient.post<TagRow>('/admin/tags', body)
    return data!
  },
  patch: async (id: string, body: Partial<{ name: string; type: string; active: boolean }>): Promise<TagRow> => {
    const { data } = await apiClient.patch<TagRow>(`/admin/tags/${id}`, body)
    return data!
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/tags/${id}`)
  },
}
