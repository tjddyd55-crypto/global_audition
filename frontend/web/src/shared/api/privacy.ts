import { apiClient } from './client'
import { unwrapData } from './unwrap'
import { parsePrivacySettings, type PrivacySettings } from '../privacy/model'

export type GuardianIssued = { token: string; expiresAt: string | null }
export type GuardianPublic = {
  status: string
  minorNickname: string | null
  policyCountry: string | null
  expiresAt: string | null
  termsVersion: string | null
}

const parseIssued = (raw: unknown): GuardianIssued => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  return { token: String(r.token ?? ''), expiresAt: typeof r.expiresAt === 'string' ? r.expiresAt : null }
}

export const parseGuardianPublic = (raw: unknown): GuardianPublic => {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const s = (v: unknown) => (typeof v === 'string' ? v : null)
  return {
    status: String(r.status ?? 'PENDING'),
    minorNickname: s(r.minorNickname),
    policyCountry: s(r.policyCountry),
    expiresAt: s(r.expiresAt),
    termsVersion: s(r.termsVersion),
  }
}

/** 마이프로필 개인정보 및 공개 설정 (/api/me/privacy). */
export const privacyApi = {
  get: async (): Promise<PrivacySettings> => parsePrivacySettings(unwrapData((await apiClient.get<unknown>('/me/privacy')).data)),
  save: async (patch: Record<string, unknown>): Promise<PrivacySettings> =>
    parsePrivacySettings(unwrapData((await apiClient.put<unknown>('/me/privacy', patch)).data)),
  consent: async (type: string, agree: boolean): Promise<PrivacySettings> =>
    parsePrivacySettings(unwrapData((await apiClient.post<unknown>('/me/consents', { type, agree })).data)),
  requestGuardian: async (body: { guardianName?: string; relationship?: string }): Promise<GuardianIssued> =>
    parseIssued(unwrapData((await apiClient.post<unknown>('/me/guardian/request', body)).data)),
}

/** 보호자 확인 페이지(비로그인). 미성년자 본인 세션 쿠키가 있으면 서버가 403 으로 막는다. */
export const guardianPublicApi = {
  view: async (token: string): Promise<GuardianPublic> =>
    parseGuardianPublic(unwrapData((await apiClient.get<unknown>(`/auth/guardian/${encodeURIComponent(token)}`)).data)),
  confirm: async (
    token: string,
    body: { guardianName: string; relationship: string; agreeGuardian: boolean; agreeTerms: boolean; agreePrivacy: boolean },
  ): Promise<GuardianPublic> =>
    parseGuardianPublic(unwrapData((await apiClient.post<unknown>(`/auth/guardian/${encodeURIComponent(token)}/confirm`, body)).data)),
  revoke: async (token: string): Promise<GuardianPublic> =>
    parseGuardianPublic(unwrapData((await apiClient.post<unknown>(`/auth/guardian/${encodeURIComponent(token)}/revoke`)).data)),
}
