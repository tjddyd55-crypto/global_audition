import { apiClient } from './client'
import { unwrapData } from './unwrap'

/** GET/PATCH /api/me (프로필 관리·지원서 자동 입력 SSOT) */
export type MeProfileResponse = {
  id?: string
  email?: string | null
  username?: string | null
  nickname?: string | null
  name?: string | null
  birthDate?: string | null
  nationality?: string | null
  introText?: string | null
  snsLinks?: Array<{ platform: string; url: string }>
}

/** 지원서 자동 입력에 쓰는 부분 집합 */
export type MeProfileForApply = Pick<
  MeProfileResponse,
  'name' | 'nickname' | 'birthDate' | 'nationality' | 'introText' | 'snsLinks'
>

export type PatchMeProfilePayload = {
  name: string | null
  nickname: string
  birthDate: string
  nationality: string
  introText: string
  snsLinks: Array<{ platform: string; url: string }>
}

export const meProfileApi = {
  get: async (): Promise<MeProfileResponse> => {
    const { data } = await apiClient.get<unknown>('/me')
    return unwrapData(data) as MeProfileResponse
  },

  patch: async (body: PatchMeProfilePayload): Promise<MeProfileResponse> => {
    const { data } = await apiClient.patch<unknown>('/me', body)
    return unwrapData(data) as MeProfileResponse
  },
}
