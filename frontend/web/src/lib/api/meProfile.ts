import { apiClient } from './client'
import { unwrapData } from './unwrap'

/** GET/PATCH /api/me (프로필 관리·지원서 자동 입력 SSOT) */
export type MeProfileResponse = {
  id?: string
  email?: string | null
  username?: string | null
  nickname?: string | null
  name?: string | null
  profileImageUrl?: string | null
  birthDate?: string | null
  nationality?: string | null
  country?: string | null
  /** 채널 헤더 한줄 소개(최대 30자) */
  shortBio?: string | null
  /** 채널 상세 소개(정보 탭) */
  bio?: string | null
  categories?: string[]
  featuredVideoId?: string | null
  introText?: string | null
  snsLinks?: Array<{ platform: string; url: string }>
}

/** 지원서 자동 입력에 쓰는 부분 집합 */
export type MeProfileForApply = Pick<
  MeProfileResponse,
  'name' | 'nickname' | 'birthDate' | 'nationality' | 'introText' | 'snsLinks'
>

/** PATCH 시 포함한 필드만 변경. 프로필 폼은 전체 전송, 채널 스튜디오는 부분 전송. */
export type PatchMeProfilePayload = {
  name?: string | null
  nickname?: string
  birthDate?: string
  nationality?: string
  country?: string
  profileImageUrl?: string | null
  introText?: string
  snsLinks?: Array<{ platform: string; url: string }>
  shortBio?: string | null
  bio?: string | null
  categories?: string[]
  featuredVideoId?: string | null
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

