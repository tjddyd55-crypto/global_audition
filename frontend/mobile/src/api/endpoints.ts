import { normalizeAudienceCountry } from '../domain/audience'
import { unwrapData } from './unwrap'
import { apiRequest } from './http'
import {
  parseAgencyDetail,
  parseCreditLedger,
  parseCreditPackages,
  parseCreditRuntime,
  parsePreparePayment,
  parseApplicantDashboard,
  parseApplicationDetail,
  parseAuditionDto,
  parseAuthMe,
  parseManageApplications,
  parseMyApplicationList,
  parseRankingItems,
  parseVotePage,
} from './parsers'
import type {
  AgencyBoardStatus,
  ApplicantDashboard,
  ApplicationAgencyDetail,
  ApplicationDetail,
  ApplicationStatus,
  AuditionDto,
  AuthMe,
  AuthResponse,
  CreditBalance,
  CreditLedgerPage,
  CreditPackageItem,
  CreditRuntimePublic,
  CreateApplicationPayload,
  PreparePaymentResult,
  ManageApplicationsPayload,
  MeNotificationItem,
  MeProfile,
  MyChannelMine,
  MeRoundEligibility,
  MyApplicationListItem,
  PublicVotesPage,
  RankingItem,
  UserRole,
} from './types'

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  signup: (body: { email: string; password: string; role: 'APPLICANT' | 'AGENCY'; nickname: string; name?: string }) =>
    apiRequest<AuthResponse>('/auth/signup', { method: 'POST', body, auth: false }),
  me: async (): Promise<AuthMe> => parseAuthMe(unwrapData(await apiRequest<unknown>('/auth/me'))),
  logout: () => apiRequest<unknown>('/auth/logout', { method: 'POST' }),
  identifyByRecoveryCode: async (recoveryCode: string): Promise<{ accountIdentifier: string }> =>
    unwrapData(await apiRequest<unknown>('/auth/recover/identify', { method: 'POST', body: { recoveryCode }, auth: false })),
  resetPasswordWithRecoveryCode: async (recoveryCode: string, newPassword: string): Promise<void> => {
    unwrapData(await apiRequest<unknown>('/auth/recover/reset', { method: 'POST', body: { recoveryCode, newPassword }, auth: false }))
  },
  createRecoveryHelpRequest: async (body: {
    accountIdentifier: string
    requesterName: string
    contact: string
    message?: string
  }): Promise<{ id: string; status: string }> =>
    unwrapData(
      await apiRequest<unknown>('/auth/recovery-requests', { method: 'POST', body, auth: false }),
    ),
  issueRecoveryCodeIfMissing: async (): Promise<{ recoveryCode: string; accountIdentifier: string }> =>
    unwrapData(await apiRequest<unknown>('/me/recovery-code', { method: 'POST' })),
}

export const auditionApi = {
  listOpen: async (country?: string): Promise<AuditionDto[]> => {
    const data = await apiRequest<unknown>('/auditions', {
      query: { status: 'OPEN', country: normalizeAudienceCountry(country) },
    })
    const rows = Array.isArray(data) ? data : []
    return rows.map((row) => parseAuditionDto(row))
  },
  getById: async (id: string): Promise<AuditionDto> => parseAuditionDto(await apiRequest<unknown>(`/auditions/${id}`)),
  listMine: async (): Promise<AuditionDto[]> => {
    const data = await apiRequest<unknown>('/auditions/my')
    const rows = Array.isArray(data) ? data : []
    return rows.map((row) => parseAuditionDto(row))
  },
}

export const applicationApi = {
  listMine: async (): Promise<MyApplicationListItem[]> =>
    parseMyApplicationList(unwrapData(await apiRequest<unknown>('/me/applications'))),
  getMine: async (applicationId: string): Promise<ApplicationDetail> =>
    parseApplicationDetail(unwrapData(await apiRequest<unknown>(`/me/applications/${applicationId}`))),
  submit: (body: CreateApplicationPayload) =>
    apiRequest<{ id: string; status: ApplicationStatus }>('/applications', { method: 'POST', body }),
}

export const voteApi = {
  list: async (auditionId: string, category?: string): Promise<PublicVotesPage> =>
    parseVotePage(
      unwrapData(
        await apiRequest<unknown>(`/auditions/${auditionId}/votes`, {
          query: category && category !== '전체' ? { category } : undefined,
        }),
      ),
    ),
  cast: (auditionId: string, applicationId: string) =>
    apiRequest<unknown>('/votes', { method: 'POST', body: { auditionId, applicationId } }),
  cancel: (applicationId: string) => apiRequest<unknown>(`/votes/${applicationId}`, { method: 'DELETE' }),
}

export const rankingApi = {
  list: async (auditionId: string): Promise<RankingItem[]> =>
    parseRankingItems(unwrapData(await apiRequest<unknown>(`/auditions/${auditionId}/ranking`))),
}

export const agencyApi = {
  listManage: async (auditionId: string, status?: AgencyBoardStatus | ''): Promise<ManageApplicationsPayload> =>
    parseManageApplications(
      unwrapData(
        await apiRequest<unknown>(`/auditions/${auditionId}/applications/manage`, {
          query: status ? { status } : undefined,
        }),
      ),
    ),
  getDetail: async (applicationId: string): Promise<ApplicationAgencyDetail> =>
    parseAgencyDetail(unwrapData(await apiRequest<unknown>(`/applications/${applicationId}/agency-detail`))),
  updateStatus: (applicationId: string, status: AgencyBoardStatus | 'ACCEPTED') =>
    apiRequest<unknown>(`/applications/${applicationId}/status`, { method: 'PATCH', body: { status } }),
}

export const profileApi = {
  get: async (): Promise<MeProfile> => unwrapData(await apiRequest<unknown>('/me')) as MeProfile,
  patch: async (body: Partial<MeProfile>): Promise<MeProfile> =>
    unwrapData(await apiRequest<unknown>('/me', { method: 'PATCH', body })) as MeProfile,
}

export const channelApi = {
  mine: async (): Promise<MyChannelMine> => unwrapData(await apiRequest<unknown>('/me/channel')) as MyChannelMine,
  patch: async (body: {
    channelDescription?: string
    bannerImageUrl?: string | null
    isChannelPublic?: boolean
    shownFields?: string[]
    featuredVideoId?: string
  }): Promise<MyChannelMine> => unwrapData(await apiRequest<unknown>('/me/channel', { method: 'PATCH', body })) as MyChannelMine,
}

export const notificationApi = {
  list: async (): Promise<MeNotificationItem[]> => {
    const rows = unwrapData(await apiRequest<unknown>('/me/notifications'))
    return Array.isArray(rows) ? (rows as MeNotificationItem[]) : []
  },
  markRead: async (id: string): Promise<MeNotificationItem> =>
    unwrapData(await apiRequest<unknown>(`/me/notifications/${id}/read`, { method: 'POST' })) as MeNotificationItem,
}

export const dashboardApi = {
  applicant: async (): Promise<ApplicantDashboard> =>
    parseApplicantDashboard(unwrapData(await apiRequest<unknown>('/me/dashboard'))),
}

export const roundApi = {
  eligibility: async (applicationId: string, roundId: string): Promise<MeRoundEligibility> =>
    unwrapData(await apiRequest<unknown>(`/me/applications/${applicationId}/rounds/${roundId}/eligibility`)) as MeRoundEligibility,
  submit: (applicationId: string, roundId: string, body: { videoUrl?: string; fileUrl?: string; textAnswer?: string }) =>
    apiRequest<unknown>(`/me/applications/${applicationId}/rounds/${roundId}/submit`, { method: 'POST', body }),
}

export const creditApi = {
  runtime: async (): Promise<CreditRuntimePublic> =>
    parseCreditRuntime(await apiRequest<unknown>('/credits/public/runtime', { auth: false })),
  balance: async (): Promise<CreditBalance> => {
    const data = await apiRequest<CreditBalance>('/credits/balance')
    return {
      balance: Number(data.balance ?? 0),
      freeRemaining: Number(data.freeRemaining ?? 0),
      paidRemaining: Number(data.paidRemaining ?? 0),
      unclassifiedRemaining: Number(data.unclassifiedRemaining ?? 0),
      allocationPolicy: data.allocationPolicy,
    }
  },
  packages: async (): Promise<CreditPackageItem[]> =>
    parseCreditPackages(await apiRequest<unknown>('/credit-packages')),
  ledger: async (): Promise<CreditLedgerPage> =>
    parseCreditLedger(await apiRequest<unknown>('/credits/transactions', { query: { size: 50 } })),
  prepare: async (packageId: string, provider = 'TOSS_PAYMENTS'): Promise<PreparePaymentResult> =>
    parsePreparePayment(await apiRequest<unknown>('/credits/prepare-payment', { method: 'POST', body: { packageId, provider } })),
  checkoutSession: async (orderNo: string): Promise<PreparePaymentResult> =>
    parsePreparePayment(await apiRequest<unknown>(`/credits/orders/${orderNo}/checkout`)),
  confirmToss: async (body: { paymentKey: string; orderId: string; amount: number }) =>
    apiRequest<unknown>('/payments/toss/confirm', { method: 'POST', body }),
}

export function isAgencyRole(role: UserRole | string | null | undefined): boolean {
  return role === 'AGENCY' || role === 'ADMIN' || role === 'SUPER_ADMIN'
}
