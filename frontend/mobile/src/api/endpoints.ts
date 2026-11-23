import { normalizeAudienceCountry } from '../domain/audience'
import { unwrapData } from './unwrap'
import { ApiError, apiRequest } from './http'
import { parseOffer, type CastingOffer, type CastingParty } from '../../../web/src/shared/casting/model'
import { parsePrivacySettings, type PrivacySettings } from '../../../web/src/shared/privacy/model'
import type { ContentTranslationView } from '../../../web/src/shared/i18n/contentTranslation'
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
  parseMyVoteShare,
  parseRankingPage,
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
  ChannelCareerRow,
  MyChannelVideoItem,
  PublicChannelDetail,
  MeRoundEligibility,
  MyApplicationListItem,
  PublicVotesPage,
  MyVoteShare,
  RankingItem,
  UserRole,
} from './types'

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false }),
  signup: (body: {
    email: string
    password: string
    role: 'APPLICANT' | 'AGENCY'
    nickname: string
    name?: string
    countryCode?: string
    companyName?: string
    legalName?: string
    businessRegistrationNumber?: string
    representativeName?: string
    contactPhone?: string
    businessCity?: string
    timezone?: string
    birthDate?: string
    gender?: string
    agreeTerms?: boolean
    agreePrivacyCollection?: boolean
    agreePrivacyDisclosure?: boolean
    agreeMarketing?: boolean
  }) =>
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
  listOpenVotes: async (country?: string): Promise<AuditionDto[]> => {
    const data = await apiRequest<unknown>('/auditions/voting', {
      query: { country: normalizeAudienceCountry(country) },
      auth: false,
    })
    const rows = Array.isArray(data) ? data : []
    return rows.map((row) => parseAuditionDto(row))
  },
  getById: async (id: string): Promise<AuditionDto> => parseAuditionDto(await apiRequest<unknown>(`/auditions/${id}`)),
  browse: async (query: Record<string, string | undefined>): Promise<AuditionDto[]> => {
    const data = await apiRequest<unknown>('/auditions/browse', { query, auth: false })
    const rows = Array.isArray(data) ? data : []
    return rows.map((row) => parseAuditionDto(row))
  },
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
  list: async (
    auditionId: string,
    category?: string,
    share?: { round?: number | null; candidate?: string | null },
  ): Promise<PublicVotesPage> => {
    const query: Record<string, string> = {}
    if (category && category !== '전체') query.category = category
    if (share?.round) query.round = String(share.round)
    if (share?.candidate) query.candidate = share.candidate
    return parseVotePage(
      unwrapData(
        await apiRequest<unknown>(`/auditions/${auditionId}/votes`, {
          query: Object.keys(query).length ? query : undefined,
        }),
      ),
    )
  },
  /** 지원자 본인: 확정 후보일 때만 공유 정보 */
  myShare: async (applicationId: string): Promise<MyVoteShare> =>
    parseMyVoteShare(unwrapData(await apiRequest<unknown>(`/me/applications/${applicationId}/vote-share`))),
  cast: (auditionId: string, applicationId: string) =>
    apiRequest<unknown>('/votes', { method: 'POST', body: { auditionId, applicationId } }),
  cancel: (applicationId: string) => apiRequest<unknown>(`/votes/${applicationId}`, { method: 'DELETE' }),
}

export const rankingApi = {
  list: async (auditionId: string): Promise<RankingItem[]> =>
    parseRankingItems(unwrapData(await apiRequest<unknown>(`/auditions/${auditionId}/ranking`))),
  page: async (auditionId: string) =>
    parseRankingPage(unwrapData(await apiRequest<unknown>(`/auditions/${auditionId}/ranking`))),
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
    residenceCountry?: string
    languages?: string[]
    talents?: string
    talentSearchVisible?: boolean
    castingOffersEnabled?: boolean
  }): Promise<MyChannelMine> => unwrapData(await apiRequest<unknown>('/me/channel', { method: 'PATCH', body })) as MyChannelMine,
  /** 기존 이미지 업로드 API(R2 이미지) 재사용. 영상 파일은 올리지 않는다. */
  uploadImage: async (file: { uri: string; name: string; type: string }, dir: 'profile' | 'thumbnail' = 'profile'): Promise<string> => {
    const form = new FormData()
    form.append('file', file as unknown as Blob)
    const data = (await apiRequest<unknown>('/uploads/image', { method: 'POST', query: { dir }, formData: form })) as { url?: unknown }
    const url = typeof data?.url === 'string' ? data.url.trim() : ''
    if (!url) throw new Error('UPLOAD_NO_URL')
    return url
  },
  careers: async (): Promise<ChannelCareerRow[]> => {
    const rows = unwrapData(await apiRequest<unknown>('/me/channel/careers'))
    return Array.isArray(rows) ? (rows as ChannelCareerRow[]) : []
  },
  createCareer: async (body: Partial<ChannelCareerRow> & { sourceLocale?: string }): Promise<ChannelCareerRow> =>
    unwrapData(await apiRequest<unknown>('/me/channel/careers', { method: 'POST', body })) as ChannelCareerRow,
  updateCareer: async (id: string, body: Partial<ChannelCareerRow> & { sourceLocale?: string }): Promise<ChannelCareerRow> =>
    unwrapData(await apiRequest<unknown>(`/me/channel/careers/${id}`, { method: 'PATCH', body })) as ChannelCareerRow,
  deleteCareer: (id: string) => apiRequest<unknown>(`/me/channel/careers/${id}`, { method: 'DELETE' }),
  videos: async (): Promise<MyChannelVideoItem[]> => {
    const p = unwrapData(await apiRequest<unknown>('/me/channel/videos')) as { items?: MyChannelVideoItem[] } | MyChannelVideoItem[]
    return Array.isArray(p) ? p : Array.isArray(p?.items) ? p.items : []
  },
  createVideo: async (body: { title: string; videoUrl: string; description?: string; category?: string; visibility: 'PUBLIC' | 'PRIVATE' }) =>
    unwrapData(await apiRequest<unknown>('/me/channel/videos', { method: 'POST', body })) as MyChannelVideoItem,
  updateVideo: async (id: string, body: { title?: string; videoUrl?: string; visibility?: 'PUBLIC' | 'PRIVATE' }) =>
    unwrapData(await apiRequest<unknown>(`/me/channel/videos/${id}`, { method: 'PATCH', body })) as MyChannelVideoItem,
  recheckVideo: async (id: string) =>
    unwrapData(await apiRequest<unknown>(`/me/channel/videos/${id}/check`, { method: 'POST' })) as MyChannelVideoItem,
  deleteVideo: (id: string) => apiRequest<unknown>(`/me/channel/videos/${id}`, { method: 'DELETE' }),
}

/** 지원자: 받은 캐스팅 제안. 수락은 관심 표시일 뿐 계약·지원·결제·크레딧과 무관. */
export const castingApi = {
  offers: async (): Promise<CastingOffer[]> => {
    const rows = unwrapData(await apiRequest<unknown>('/me/casting-offers'))
    return Array.isArray(rows) ? rows.map(parseOffer) : []
  },
  offer: async (id: string): Promise<CastingOffer> => parseOffer(unwrapData(await apiRequest<unknown>(`/me/casting-offers/${id}`))),
  accept: async (id: string, shareContact: boolean, note: string): Promise<CastingOffer> =>
    parseOffer(unwrapData(await apiRequest<unknown>(`/me/casting-offers/${id}/accept`, { method: 'POST', body: { shareContact, note: note || null } }))),
  decline: async (id: string, reason: string, note: string): Promise<CastingOffer> =>
    parseOffer(unwrapData(await apiRequest<unknown>(`/me/casting-offers/${id}/decline`, { method: 'POST', body: { reason, note: note || null } }))),
  report: async (id: string, reason: string, detail: string, blockAgency: boolean): Promise<void> => {
    await apiRequest<unknown>(`/me/casting-offers/${id}/report`, { method: 'POST', body: { reason, detail, blockAgency } })
  },
  block: async (id: string): Promise<void> => {
    await apiRequest<unknown>(`/me/casting-offers/${id}/block`, { method: 'POST', body: {} })
  },
  blocks: async (): Promise<CastingParty[]> => {
    const rows = unwrapData(await apiRequest<unknown>('/me/casting-blocks'))
    return Array.isArray(rows) ? (rows as CastingParty[]) : []
  },
  unblock: async (agencyUserId: string): Promise<void> => {
    await apiRequest<unknown>(`/me/casting-blocks/${agencyUserId}`, { method: 'DELETE' })
  },
}

/** 마이프로필 '개인정보 및 공개 설정' + 동의 + 보호자 확인 링크. 미성년자 판정은 서버가 국가 정책으로 한다. */
export const privacyApi = {
  get: async (): Promise<PrivacySettings> => parsePrivacySettings(unwrapData(await apiRequest<unknown>('/me/privacy'))),
  save: async (patch: Record<string, unknown>): Promise<PrivacySettings> =>
    parsePrivacySettings(unwrapData(await apiRequest<unknown>('/me/privacy', { method: 'PUT', body: patch }))),
  consent: async (type: string, agree: boolean): Promise<PrivacySettings> =>
    parsePrivacySettings(unwrapData(await apiRequest<unknown>('/me/consents', { method: 'POST', body: { type, agree } }))),
  requestGuardian: async (body: { guardianName?: string; relationship?: string }): Promise<{ token: string; expiresAt: string | null }> => {
    const r = unwrapData(await apiRequest<unknown>('/me/guardian/request', { method: 'POST', body })) as Record<string, unknown>
    return { token: String(r?.token ?? ''), expiresAt: typeof r?.expiresAt === 'string' ? r.expiresAt : null }
  },
}

/** 자유 입력 번역(비동기 큐). 404면 번역 없음. */
export const contentTranslationApi = {
  view: async (type: string, id: string, locale: string, original: boolean): Promise<ContentTranslationView | null> => {
    try {
      return (await apiRequest<unknown>(`/content-translations/${type}/${id}`, { query: { locale, original: String(original) } })) as ContentTranslationView
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null
      throw e
    }
  },
}

/** 서버 오류 코드(예: OFFER_EXPIRED). 문장은 화면에 쓰지 않는다. */
export function apiErrorCodeOf(e: unknown): string {
  const body = e instanceof ApiError ? (e.body as { message?: unknown; code?: unknown } | null) : null
  for (const v of [body?.code, body?.message]) {
    if (typeof v === 'string' && /^[A-Z][A-Z0-9_]+$/.test(v.trim())) return v.trim()
  }
  return ''
}

export type NotificationSettings = {
  savedDeadline: boolean
  newMatch: boolean
  results: boolean
  offers: boolean
}

export const notificationApi = {
  list: async (): Promise<MeNotificationItem[]> => {
    const rows = unwrapData(await apiRequest<unknown>('/me/notifications'))
    return Array.isArray(rows) ? (rows as MeNotificationItem[]) : []
  },
  markRead: async (id: string): Promise<MeNotificationItem> =>
    unwrapData(await apiRequest<unknown>(`/me/notifications/${id}/read`, { method: 'POST' })) as MeNotificationItem,
  settings: async (): Promise<NotificationSettings> =>
    unwrapData(await apiRequest<unknown>('/me/notification-settings')) as NotificationSettings,
  updateSettings: async (body: NotificationSettings): Promise<NotificationSettings> =>
    unwrapData(await apiRequest<unknown>('/me/notification-settings', { method: 'PUT', body })) as NotificationSettings,
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

export const publicPlatformApi = {
  channels: async (query?: Record<string, string | undefined>) =>
    unwrapData(await apiRequest<unknown>('/channels/public', { query, auth: false })),
  videos: async (category?: string) =>
    unwrapData(await apiRequest<unknown>('/videos/browse', { query: category ? { category } : undefined, auth: false })),
  video: async (id: string) => unwrapData(await apiRequest<unknown>(`/videos/${id}/public`, { auth: false })),
  /** 로그인 시 토큰을 붙여 subscribed 여부를 받는다(비로그인도 허용). */
  channel: async (userId: string) => unwrapData(await apiRequest<unknown>(`/channels/${userId}`)) as PublicChannelDetail,
  channelVideos: async (userId: string): Promise<MyChannelVideoItem[]> => {
    const body = unwrapData(await apiRequest<unknown>('/videos/public', { query: { channelOwnerId: userId }, auth: false }))
    if (Array.isArray(body)) return body as MyChannelVideoItem[]
    const items = (body as { items?: unknown })?.items
    return Array.isArray(items) ? (items as MyChannelVideoItem[]) : []
  },
  follow: (userId: string) => apiRequest<unknown>('/subscribe', { method: 'POST', body: { channelOwnerId: userId } }),
  unfollow: (userId: string) => apiRequest<unknown>('/subscribe', { method: 'DELETE', body: { channelOwnerId: userId } }),
  bumpView: async (videoId: string) =>
    unwrapData(await apiRequest<unknown>(`/videos/${videoId}/view`, { method: 'POST' })) as { viewCount?: number } | null,
  agencies: async () => unwrapData(await apiRequest<unknown>('/agencies/public', { auth: false })),
  agency: async (id: string) => unwrapData(await apiRequest<unknown>(`/agencies/public/${id}`, { auth: false })),
}


export type SavedAuditionItem = {
  auditionId: string
  savedAt: string
  available: boolean
  recruitmentStatus: 'OPEN' | 'CLOSED' | 'UPCOMING' | 'UNAVAILABLE'
  title?: string | null
  agencyName?: string | null
  coverImage?: string | null
  countryCode?: string | null
  hostCountry?: string | null
  recruitFields?: string[]
  deadlineAt?: string | null
  startDate?: string | null
  endDate?: string | null
}

export const auditionSavesApi = {
  list: async (): Promise<SavedAuditionItem[]> => {
    const rows = unwrapData(await apiRequest<unknown>('/me/audition-saves'))
    return Array.isArray(rows) ? (rows as SavedAuditionItem[]) : []
  },
  ids: async (): Promise<string[]> => {
    const body = unwrapData(await apiRequest<unknown>('/me/audition-saves/ids')) as { ids?: string[] } | string[] | null
    if (Array.isArray(body)) return body.map(String)
    return Array.isArray(body?.ids) ? body.ids.map(String) : []
  },
  save: async (auditionId: string): Promise<SavedAuditionItem> =>
    unwrapData(await apiRequest<unknown>(`/me/audition-saves/${auditionId}`, { method: 'PUT' })) as SavedAuditionItem,
  unsave: async (auditionId: string): Promise<void> => {
    await apiRequest<unknown>(`/me/audition-saves/${auditionId}`, { method: 'DELETE' })
  },
}


export type RecommendedAuditionItem = {
  audition: AuditionDto
  reasons: string[]
  eligibility: 'ELIGIBLE' | 'INELIGIBLE' | 'UNKNOWN'
  score: number
}

export type AuditionRecommendationPage = {
  items: RecommendedAuditionItem[]
  fallback: boolean
  personalized: boolean
}

export const auditionRecommendationsApi = {
  list: async (country?: string, limit = 6): Promise<AuditionRecommendationPage> => {
    const data = await apiRequest<unknown>('/auditions/recommendations', {
      query: { country: normalizeAudienceCountry(country), limit: String(limit) },
    })
    const body = data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {}
    const list = Array.isArray(body.items) ? body.items : Array.isArray(data) ? data : []
    const items: RecommendedAuditionItem[] = []
    for (const raw of list) {
      const row = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
      if (!row) continue
      const auditionRaw = (row.audition ?? row) as Record<string, unknown>
      const eligibilityRaw = String(row.eligibility ?? 'UNKNOWN').toUpperCase()
      items.push({
        audition: parseAuditionDto(auditionRaw),
        reasons: Array.isArray(row.reasons) ? row.reasons.map(String) : [],
        eligibility: eligibilityRaw === 'ELIGIBLE' || eligibilityRaw === 'INELIGIBLE' ? eligibilityRaw : 'UNKNOWN',
        score: Number(row.score ?? 0),
      })
    }
    return { items, fallback: Boolean(body.fallback), personalized: Boolean(body.personalized) }
  },
  closingSoon: async (country?: string, limit = 6): Promise<AuditionDto[]> => {
    const data = await apiRequest<unknown>('/auditions/closing-soon', {
      query: { country: normalizeAudienceCountry(country), limit: String(limit) },
      auth: false,
    })
    const rows = Array.isArray(data) ? data : []
    return rows.map((row) => parseAuditionDto(row as Record<string, unknown>))
  },
}

export function isAgencyRole(role: UserRole | string | null | undefined): boolean {
  return role === 'AGENCY' || role === 'ADMIN' || role === 'SUPER_ADMIN'
}
