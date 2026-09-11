/**
 * 네이티브가 소비하는 API DTO.
 * 값은 백엔드/웹 SSOT와 동일하다. UI 편의를 위한 새 status enum을 만들지 않는다.
 */

export type UserRole = 'APPLICANT' | 'AGENCY' | 'ADMIN' | 'SUPER_ADMIN' | 'USER'

export type AuditionStatus = 'DRAFT' | 'OPEN' | 'CLOSED'
export type ApplicationStatus = 'SUBMITTED' | 'REVIEWING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
export type AgencyBoardStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'
export type ProcessMode = 'SINGLE' | 'MULTI_ROUND'
export type NationalityCode = 'KR' | 'MN' | 'JP' | 'OTHER'

export type AuthResponse = {
  token: string
  role: string
  userId: string
  email?: string
  nickname?: string
  profileImageUrl?: string | null
  /** 회원가입·재발급 응답에만 한 번. 로그인은 포함하지 않는다. */
  recoveryCode?: string | null
}

export type AuthMe = {
  userId: string
  email: string
  role: UserRole
  nickname?: string | null
  name?: string | null
  displayName?: string | null
  profileImageUrl?: string | null
}

export type AuditionImages = {
  original: string | null
  medium: string | null
  thumb: string | null
}

export type RoundSummary = {
  roundId: string
  roundNumber: number
}

export type AuditionDto = {
  id: string
  ownerId: string
  title: string
  description: string
  status: string
  updatedAt?: string
  countryCode?: string | null
  deadlineAt?: string | null
  tags: string[]
  createdAt: string
  images: AuditionImages
  videoUrl?: string | null
  galleryImages: string[]
  agencyName: string
  agencyLogo?: string | null
  applicantsCount: number
  remainingDays: number
  recruitFields: string[]
  qualifications: string[]
  schedules: string[]
  location: string
  startDate: string
  endDate: string
  benefits: string[]
  hasApplied?: boolean
  processMode?: string
  currentRoundNumber?: number | null
  maxRoundNumber?: number | null
  selectionStatus?: string | null
  myApplicationId?: string | null
  myCurrentRoundNumber?: number | null
  roundSummaries?: RoundSummary[]
  groupId?: string
  round?: number
  displayTitle?: string
  recruitmentRoundLabel?: string
  canApply?: boolean
  applyBlockedMessage?: string
}

export type MyApplicationListItem = {
  id: string
  auditionId: string
  auditionTitle: string
  status: ApplicationStatus
  createdAt: string
}

export type ApplicationDetail = {
  id: string
  auditionId: string
  auditionTitle: string
  status: ApplicationStatus
  createdAt: string
  name?: string | null
  birthDate?: string | null
  age?: number | null
  nationality?: string | null
  introText?: string | null
  videoUrl?: string | null
  snsLinks: { platform: string; url: string }[]
  processMode: string
  currentRoundNumber: number
  maxRoundNumber?: number | null
  roundSummaries: RoundSummary[]
  videos: { id: string; title: string; videoUrl: string; thumbnailUrl?: string | null }[]
}

export type CreateApplicationPayload = {
  auditionId: string
  name?: string | null
  birthDate?: string | null
  age?: number | null
  nationality?: string | null
  videoUrl: string
  introText?: string | null
  snsLinks?: { platform: string; url: string }[]
}

export type PublicVoteItem = {
  applicationId: string
  userName: string
  userEmail: string
  description: string
  videoUrl: string
  thumbnailUrl: string | null
  category: string
  voteCount: number
  viewCount: number
  isVoted: boolean
  rank: number
  status?: string
}

export type PublicVotesPage = {
  audition: {
    id: string
    title: string
    description: string
    applicantCount: number
    totalVotes: number
    categories: { name: string; count: number }[]
  }
  summary: {
    applicantCount: number
    totalVotes: number
    totalViewCount: number
    myVoteCount: number
  }
  myVoteApplicationId: string | null
  items: PublicVoteItem[]
}

export type ManageApplicantItem = {
  applicationId: string
  userName: string
  name: string
  userEmail: string
  videoUrl: string
  thumbnailUrl: string | null
  category: string
  viewCount: number
  likeCount: number
  voteCount: number
  age: number | null
  nationality: string | null
  snsCount: number
  round: number
  createdAt: string | null
  status: AgencyBoardStatus
}

export type ManageApplicationsPayload = {
  audition: {
    id: string
    title: string
    description: string
    processMode: string
    maxRoundNumber: number | null
  }
  stats: {
    total: number
    submitted: number
    reviewing: number
    accepted: number
    rejected: number
  }
  items: ManageApplicantItem[]
  maxRound: number
}

export type ApplicationAgencyDetail = {
  id: string
  auditionId: string
  name: string
  birthDate: string | null
  age: number | null
  nationality: string | null
  videoUrl: string
  thumbnailUrl: string | null
  introText: string | null
  status: AgencyBoardStatus
  round: number
  createdAt: string | null
  snsLinks: { platform: string; url: string }[]
}

export type MeProfile = {
  id?: string
  email?: string | null
  nickname?: string | null
  name?: string | null
  profileImageUrl?: string | null
  birthDate?: string | null
  nationality?: string | null
  introText?: string | null
  snsLinks?: { platform: string; url: string }[]
}

export type ApplicantDashboard = {
  applied: number
  reviewed: number
  accepted: number
  rejected: number
  videosCount: number
}

export type RankingItem = {
  applicationId: string
  userName: string
  category: string
  voteCount: number
  viewCount: number
  status: string
  rank: number
}

export type MeRoundEligibility = {
  canSubmit: boolean
  reason: string | null
  submissionStatus: string | null
}

export type NotificationType = 'ROUND_OPEN' | 'PASS_NOTICE' | 'FAIL_NOTICE' | 'FINAL_NOTICE'
export type NotificationDeliveryStatus = 'PENDING' | 'SENT' | 'FAILED'

export type CreditRuntimePublic = {
  applicationPaymentMode: 'FREE' | 'CREDIT' | string
  applicationFeeCredits: number
  signupCreditEnabled: boolean
  signupCreditAmount: number
}

export type CreditBalance = {
  balance: number
}

export type CreditPackageItem = {
  id: string
  name: string
  price: number
  credits: number
  bonusCredits: number
}

export type CreditLedgerItem = {
  id: string
  amount: number
  type: string
  reason: string
  createdAt: string
  note?: string | null
}

export type CreditLedgerPage = {
  content: CreditLedgerItem[]
}

export type PreparePaymentResult = {
  orderNo: string
  orderId: string
  packageId: string
  packageName: string
  amount: number
  credits: number
  bonusCredits: number
  currency: string
  status: string
  provider?: string
  clientKey?: string
  tossAmount?: number
  orderName?: string
  successUrl?: string
  failUrl?: string
}

export type InsufficientCredits = {
  code: 'INSUFFICIENT_CREDITS'
  requiredCredits: number
  currentCredits: number
  shortfallCredits: number
  message: string
}
