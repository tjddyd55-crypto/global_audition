/**
 * 네이티브가 소비하는 API DTO.
 * 값은 백엔드/웹 SSOT와 동일하다. UI 편의를 위한 새 status enum을 만들지 않는다.
 */

export type UserRole = 'APPLICANT' | 'AGENCY' | 'ADMIN' | 'SUPER_ADMIN' | 'USER'

export type AuditionStatus = 'DRAFT' | 'OPEN' | 'CLOSED'
export type ApplicationStatus = 'SUBMITTED' | 'REVIEWING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED'
export type AgencyBoardStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'
export type ProcessMode = 'SINGLE' | 'MULTI_ROUND'
export type NationalityCode = 'KR' | 'MN' | 'JP' | 'KH' | 'UZ' | 'OTHER'

export type AuthResponse = {
  token: string
  role: string
  userId: string
  email?: string
  nickname?: string
  profileImageUrl?: string | null
  /** 회원가입·재발급 응답에만 한 번. 로그인은 포함하지 않는다. */
  recoveryCode?: string | null
  /** 가입 응답: 국가 기준상 보호자 확인이 필요한 나이. */
  guardianRequired?: boolean
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
  /** 공고 투표 설정(서버 VotingRoundPlan). votingEnabled=false 면 투표 보기·랭킹을 숨긴다 */
  votingEnabled?: boolean
  votingRoundNumber?: number
  votingRoundCount?: number | null
  votingRounds?: number[] | null
  displayTitle?: string
  recruitmentRoundLabel?: string
  canApply?: boolean
  applyBlockedMessage?: string
  applyBlockedCode?: string
  defaultLocale?: string
  contentLocale?: string
  contentLocaleFallback?: boolean
  preview?: boolean
  showingOriginal?: boolean
  translationStatus?: string | null
  translationStale?: boolean
  translationErrorCode?: string | null
  translationOrigin?: string | null
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
  /** 현재 회차 투표 사용 여부(없으면 true) */
  votingEnabled: boolean
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
  countryCode?: string | null
  timezone?: string | null
  introText?: string | null
  shortBio?: string | null
  bio?: string | null
  careerText?: string | null
  categories?: string[]
  activityFields?: string[]
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
  /** 공개 프로필 이미지(없으면 null) */
  avatarUrl: string | null
  category: string
  voteCount: number
  viewCount: number
  status: string
  rank: number
  /** 현재 회차 내 표 */
  isVoted: boolean
}

/** 회차 랭킹 응답. 공개 응답은 득표·순위만, manageView(공고 기획사·관리자)일 때만 분류·상태 등이 채워진다. */
export type RankingPage = {
  votingEnabled: boolean
  roundNumber: number
  manageView: boolean
  items: RankingItem[]
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
  applicationFeeUsd: number
  signupCreditEnabled: boolean
  signupCreditAmount: number
}

export type CreditBalance = {
  balance: number
  freeRemaining?: number
  paidRemaining?: number
  unclassifiedRemaining?: number
  allocationPolicy?: string
}

export type MeNotificationItem = {
  id: string
  type: string
  status: string
  title: string
  body: string
  titleKey?: string | null
  bodyKey?: string | null
  roundId?: string | null
  createdAt?: string | null
  readAt?: string | null
  auditionId?: string | null
  applicationId?: string | null
  link?: string | null
  params?: Record<string, string> | null
}

export type MyChannelMine = {
  channelDescription?: string | null
  bannerImageUrl?: string | null
  channelPublic?: boolean
  isPublic?: boolean
  name?: string | null
  nickname?: string | null
  introText?: string | null
  nationality?: string | null
  shortBio?: string | null
  bio?: string | null
  categories?: string[]
  careerText?: string | null
  activityFields?: string[]
  snsLinks?: { platform: string; url: string }[]
  shownFields?: string[]
  selectionCustomized?: boolean
  videoCount?: number
  subscriberCount?: number
  viewCount?: number
  userId?: string
  featuredVideoId?: string | null
  residenceCountry?: string | null
  languages?: string[]
  talents?: string | null
  talentSearchVisible?: boolean
  castingOffersEnabled?: boolean
  ageBand?: string | null
  adultConfirmed?: boolean
  birthDateSet?: boolean
  maxVideos?: number
}

export type ChannelCareerRow = {
  id: string
  category: string
  title: string
  organization?: string | null
  periodStart?: string | null
  periodEnd?: string | null
  description?: string | null
  visible: boolean
  sortOrder?: number
}

export type MyChannelVideoItem = {
  videoId: string
  title: string
  videoUrl: string
  description?: string | null
  category?: string | null
  thumbnailUrl?: string | null
  visibility: string
  viewCount: number
  youtubeVideoId?: string | null
  embedStatus?: string | null
  shorts?: boolean
}

export type PublicChannelDetail = {
  userId: string
  displayName?: string
  nickname?: string | null
  profileImageUrl?: string | null
  bannerImageUrl?: string | null
  nationality?: string | null
  country?: string | null
  residenceCountry?: string | null
  ageBand?: string | null
  languages?: string[]
  talents?: string | null
  mainField?: string | null
  shortBio?: string | null
  bio?: string | null
  introText?: string | null
  channelDescription?: string | null
  careerText?: string | null
  categories?: string[]
  activityFields?: string[]
  snsLinks?: { platform: string; url: string }[]
  careers?: ChannelCareerRow[]
  featuredVideoId?: string | null
  featuredVideo?: { videoId?: string } | null
  subscribed?: boolean
  videoCount?: number
  subscriberCount?: number
  viewCount?: number
  acceptsCastingOffers?: boolean
  canSendCastingOffer?: boolean
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
  variantKey?: string
  tossMethod?: string
  foreignEasyPayProvider?: string
}

export type InsufficientCredits = {
  code: 'INSUFFICIENT_CREDITS'
  requiredCredits: number
  currentCredits: number
  shortfallCredits: number
  message: string
}
