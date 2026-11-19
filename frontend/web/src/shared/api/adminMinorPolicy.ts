import { apiClient } from './client'
import { unwrapData } from './unwrap'

export type CountryMinorPolicy = {
  countryCode: string
  adultAge: number
  guardianConsentUnderAge: number
  guardianRequiredForApply: boolean
  minorOffersRequireGuardian: boolean
  minorContactSharingAllowed: boolean
  note: string | null
  updatedAt: string | null
}

export type MinorPolicySummary = {
  consents: Record<string, Record<string, number>>
  guardians: Record<string, number>
  membersWithoutConsentRecords: number
  requirementsOpen: number
}

export type AdminConsentRow = {
  type: string
  termsVersion: string | null
  status: string
  agreedAt: string | null
  withdrawnAt: string | null
  source: string | null
  createdAt: string | null
}

export type AdminGuardianRow = {
  id: string
  status: string
  guardianName: string | null
  relationship: string | null
  guardianEmailMasked: string | null
  method: string
  policyCountry: string | null
  requestedAt: string | null
  expiresAt: string | null
  confirmedAt: string | null
  revokedAt: string | null
  revokedBy: string | null
}

export type AdminRequirementRow = {
  id: string
  applicationId: string | null
  castingOfferId: string | null
  activityType: string
  guardianRequired: boolean
  status: string
  note: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type AdminUserConsents = {
  userId: string
  nickname: string | null
  countryCode: string | null
  birthDateSet: boolean
  minor: Record<string, unknown>
  history: AdminConsentRow[]
  guardians: AdminGuardianRow[]
  requirements: AdminRequirementRow[]
}

export const POST_SELECTION_ACTIVITIES = [
  'FINAL_CONTRACT',
  'EXCLUSIVE_CONTRACT',
  'TRAINEE_CONTRACT',
  'IN_PERSON_AUDITION',
  'OVERSEAS_TRAVEL',
  'TRAVEL_LODGING',
  'FILMING_PERFORMANCE',
  'PORTRAIT_CONTENT_RIGHTS',
  'OTHER_GUARDIAN_REQUIRED',
] as const

export const REQUIREMENT_STATUSES = ['REQUIRED', 'IN_PROGRESS', 'SATISFIED', 'NOT_REQUIRED', 'CANCELLED'] as const

/** 본사(HQ) 전용: 국가별 미성년자 정책 · 동의 현황 · 회원별 동의/보호자/선발 이후 요건. 변경은 감사 로그에 남는다. */
export const adminMinorPolicyApi = {
  countries: async (): Promise<CountryMinorPolicy[]> => {
    const rows = unwrapData((await apiClient.get<unknown>('/admin/minor-policy/countries')).data)
    return Array.isArray(rows) ? (rows as CountryMinorPolicy[]) : []
  },
  save: async (code: string, body: Partial<Omit<CountryMinorPolicy, 'countryCode' | 'updatedAt'>>): Promise<CountryMinorPolicy> =>
    unwrapData((await apiClient.put<unknown>(`/admin/minor-policy/countries/${encodeURIComponent(code)}`, body)).data) as CountryMinorPolicy,
  summary: async (): Promise<MinorPolicySummary> =>
    unwrapData((await apiClient.get<unknown>('/admin/minor-policy/summary')).data) as MinorPolicySummary,
  user: async (userId: string): Promise<AdminUserConsents> =>
    unwrapData((await apiClient.get<unknown>(`/admin/minor-policy/users/${encodeURIComponent(userId)}`)).data) as AdminUserConsents,
  correctBirthDate: async (userId: string, birthDate: string, reason: string): Promise<{ before: string | null; after: string }> =>
    unwrapData((await apiClient.post<unknown>(`/admin/minor-policy/users/${encodeURIComponent(userId)}/birth-date`, { birthDate, reason })).data) as {
      before: string | null
      after: string
    },
  revokeGuardian: async (id: string): Promise<void> => {
    await apiClient.post(`/admin/minor-policy/guardians/${encodeURIComponent(id)}/revoke`)
  },
  createRequirement: async (body: {
    userId: string
    applicationId?: string
    castingOfferId?: string
    activityType: string
    guardianRequired?: boolean
    note?: string
  }): Promise<AdminRequirementRow> =>
    unwrapData((await apiClient.post<unknown>('/admin/minor-policy/requirements', body)).data) as AdminRequirementRow,
  setRequirementStatus: async (id: string, status: string, note?: string): Promise<void> => {
    await apiClient.post(`/admin/minor-policy/requirements/${encodeURIComponent(id)}/status`, { status, note })
  },
}
