/** GET /auditions/:id/votes */
export type VotePageCategory = { name: string; count: number }

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
  recommendedScore?: number | null
  recommendedRank?: number | null
  recommended?: boolean | null
}

export type PublicVotesPagePayload = {
  audition: {
    id: string
    title: string
    description: string
    applicantCount: number
    totalVotes: number
    categories: VotePageCategory[]
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

export type ManageApplicationStats = {
  total: number
  submitted: number
  reviewing: number
  accepted: number
  rejected: number
}

/** 기획사 보드 API 상태 (백엔드 agencyBoardStatusToApi) */
export type AgencyBoardStatus = 'PENDING' | 'REVIEWING' | 'APPROVED' | 'REJECTED'

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
  /** 지원서 현재 차수 (1=1차) */
  round: number
  createdAt: string | null
  recommendedScore?: number | null
  recommendedRank?: number | null
  rank?: number | null
  recommended?: boolean | null
  isVoted?: boolean
  status: AgencyBoardStatus
}

export type ManageListFilters = {
  category?: string | null
  minAge?: number | null
  maxAge?: number | null
  nationality?: string | null
  hasSns?: boolean | null
  status?: AgencyBoardStatus | '' | null
  /** 특정 차수만 (미전달 시 전체) */
  round?: number | null
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
  snsLinks: Array<{ platform: string; url: string }>
}

export type ManageRoundCount = { round: number; count: number }

export type ManageAuditionHeader = {
  id: string
  title: string
  description: string
  processMode: string
  maxRoundNumber: number | null
}

export type ManageApplicationsPayload = {
  audition: ManageAuditionHeader
  stats: ManageApplicationStats
  categories: VotePageCategory[]
  items: ManageApplicantItem[]
  applicantTotalCount: number
  maxRound: number
  roundCounts: ManageRoundCount[]
}

export type RankingItem = {
  applicationId: string
  userName: string
  category: string
  voteCount: number
  viewCount: number
  status: string
  score: number
  recommendedScore: number
  rank: number
  recommended: boolean
  isVoted: boolean
}
