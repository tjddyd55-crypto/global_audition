import { apiClient } from './client'

export interface AuditionResponse {
  id: string
  ownerId: string
  title: string
  description: string | null
  status: 'DRAFT' | 'OPEN' | 'CLOSED'
  createdAt: string
  updatedAt?: string
  countryCode?: string | null
  deadlineAt?: string | null
  category?: string | null
}

export const auditionApi = {
  listOpen: async (): Promise<AuditionResponse[]> => {
    const { data } = await apiClient.get<AuditionResponse[]>('/auditions', { params: { status: 'OPEN' } })
    return data
  },

  getById: async (id: string): Promise<AuditionResponse> => {
    const { data } = await apiClient.get<AuditionResponse>(`/auditions/${id}`)
    return data
  },

  create: async (body: {
    title: string
    description?: string
    status?: 'DRAFT' | 'OPEN' | 'CLOSED'
    countryCode?: string
    deadlineAt?: string
    category?: string
  }): Promise<AuditionResponse> => {
    const { data } = await apiClient.post<AuditionResponse>('/auditions', body)
    return data
  },

  getMyAuditions: async (_params: { page?: number; size?: number } = {}): Promise<{ content: AuditionResponse[]; totalPages: number }> => {
    const { data } = await apiClient.get<AuditionResponse[]>('/auditions/my')
    const content = data ?? []
    return { content, totalPages: Math.max(1, Math.ceil(content.length / 20)) }
  },

  update: async (
    id: string,
    body: {
      title?: string
      description?: string
      status?: 'DRAFT' | 'OPEN' | 'CLOSED'
      countryCode?: string
      deadlineAt?: string
      category?: string
    }
  ): Promise<AuditionResponse> => {
    const { data } = await apiClient.patch<AuditionResponse>(`/auditions/${id}`, body)
    return data
  },

  deleteAudition: async (id: string | number): Promise<void> => {
    await apiClient.delete(`/auditions/${id}`)
  },
}
