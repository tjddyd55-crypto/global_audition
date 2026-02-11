import { apiClient } from './client'

export interface AuditionResponse {
  id: string
  ownerId: string
  title: string
  description: string | null
  status: 'DRAFT' | 'OPEN' | 'CLOSED'
  createdAt: string
}

export const auditionApi = {
  list: async (): Promise<AuditionResponse[]> => {
    const { data } = await apiClient.get<AuditionResponse[]>('/auditions')
    return data
  },

  getById: async (id: string): Promise<AuditionResponse> => {
    const { data } = await apiClient.get<AuditionResponse>(`/auditions/${id}`)
    return data
  },

  create: async (body: { title: string; description?: string; status?: string }): Promise<AuditionResponse> => {
    const { data } = await apiClient.post<AuditionResponse>('/auditions', body)
    return data
  },

  /** List auditions owned by current user (GET /api/auditions/mine). */
  getMyAuditions: async (_params: { page: number; size: number }): Promise<{ content: AuditionResponse[]; totalPages: number }> => {
    const { data } = await apiClient.get<AuditionResponse[]>('/auditions/mine')
    const content = data ?? []
    return { content, totalPages: Math.max(1, Math.ceil(content.length / 20)) }
  },

  /** Dashboard stats: totalAuditions from my list; totalApplicants summed from each audition's applications. */
  getDashboardStats: async (): Promise<{ totalAuditions: number; totalApplicants: number }> => {
    const { content } = await auditionApi.getMyAuditions({ page: 0, size: 500 })
    const { applicationApi } = await import('./applications')
    let totalApplicants = 0
    for (const a of content) {
      try {
        const list = await applicationApi.listByAudition(a.id)
        totalApplicants += list.length
      } catch {
        // ignore per-audition errors
      }
    }
    return { totalAuditions: content.length, totalApplicants }
  },

  /** MVP: delete not implemented in backend; stub throws. */
  deleteAudition: async (_id: string | number): Promise<void> => {
    const err = new Error('삭제 기능은 현재 지원되지 않습니다.') as Error & { response?: { data?: { message?: string } } }
    err.response = { data: { message: '삭제 기능은 현재 지원되지 않습니다.' } }
    throw err
  },
}
