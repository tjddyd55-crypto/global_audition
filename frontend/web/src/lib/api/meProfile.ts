import { apiClient } from './client'
import { unwrapData } from './unwrap'

/** GET /api/me (내 정보 관리·지원서 자동 입력 SSOT) */
export type MeProfileForApply = {
  name?: string | null
  birthDate?: string | null
  nationality?: string | null
  introText?: string | null
  snsLinks?: Array<{ platform: string; url: string }>
}

export const meProfileApi = {
  get: async (): Promise<MeProfileForApply> => {
    const { data } = await apiClient.get<unknown>('/me')
    return unwrapData(data) as MeProfileForApply
  },
}
