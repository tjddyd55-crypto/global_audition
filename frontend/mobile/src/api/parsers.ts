import type {
  ApplicantDashboard,
  ApplicationAgencyDetail,
  ApplicationDetail,
  ApplicationStatus,
  AuditionDto,
  AuditionImages,
  AuthMe,
  ManageApplicationsPayload,
  MyApplicationListItem,
  PublicVoteItem,
  PublicVotesPage,
  RankingItem,
  UserRole,
} from './types'

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown, fallback = ''): string {
  return value == null ? fallback : String(value)
}

function asNumber(value: unknown, fallback = 0): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function asStringArr(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((item) => String(item)).filter((item) => item.trim().length > 0)
}

function parseImages(raw: Record<string, unknown>): AuditionImages {
  const nest = asRecord(raw.images)
  const original = asString(nest.original).trim()
  const medium = asString(nest.medium).trim()
  const thumb = asString(nest.thumb).trim()
  if (original || medium || thumb) {
    const base = original || medium || thumb
    return { original: original || base, medium: medium || base, thumb: thumb || base }
  }
  const legacy = asString(raw.coverImage || raw.imageUrl).trim()
  if (legacy) return { original: legacy, medium: legacy, thumb: legacy }
  return { original: null, medium: null, thumb: null }
}

export function parseAuditionDto(raw: unknown): AuditionDto {
  const row = asRecord(raw)
  return {
    id: asString(row.id),
    ownerId: asString(row.ownerId),
    title: asString(row.title),
    description: asString(row.description),
    status: asString(row.status, 'DRAFT'),
    updatedAt: row.updatedAt != null ? asString(row.updatedAt) : undefined,
    countryCode: row.countryCode != null ? asString(row.countryCode) : null,
    deadlineAt: row.deadlineAt != null ? asString(row.deadlineAt) : null,
    tags: asStringArr(row.tags),
    createdAt: asString(row.createdAt),
    images: parseImages(row),
    videoUrl: row.videoUrl != null ? asString(row.videoUrl) : null,
    galleryImages: asStringArr(row.galleryImages),
    agencyName: asString(row.agencyName),
    agencyLogo: row.agencyLogo != null ? asString(row.agencyLogo) : null,
    applicantsCount: asNumber(row.applicantsCount),
    remainingDays: asNumber(row.remainingDays),
    recruitFields: asStringArr(row.recruitFields),
    qualifications: asStringArr(row.qualifications),
    schedules: asStringArr(row.schedules),
    location: asString(row.location),
    startDate: asString(row.startDate),
    endDate: asString(row.endDate),
    benefits: asStringArr(row.benefits),
    hasApplied: typeof row.hasApplied === 'boolean' ? row.hasApplied : undefined,
    processMode: row.processMode != null ? asString(row.processMode) : 'SINGLE',
    currentRoundNumber: row.currentRoundNumber != null ? asNumber(row.currentRoundNumber, 1) : null,
    maxRoundNumber: row.maxRoundNumber != null ? asNumber(row.maxRoundNumber, 1) : null,
    selectionStatus: row.selectionStatus != null ? asString(row.selectionStatus) : null,
    myApplicationId: asString(row.myApplicationId) || null,
    myCurrentRoundNumber: row.myCurrentRoundNumber != null ? asNumber(row.myCurrentRoundNumber) : null,
    roundSummaries: Array.isArray(row.roundSummaries)
      ? row.roundSummaries.map((item) => {
          const r = asRecord(item)
          return { roundId: asString(r.roundId), roundNumber: asNumber(r.roundNumber) }
        })
      : [],
    groupId: asString(row.groupId) || undefined,
    round: row.round != null ? asNumber(row.round, 1) : 1,
    displayTitle: asString(row.displayTitle).trim() || undefined,
    recruitmentRoundLabel: asString(row.recruitmentRoundLabel).trim() || undefined,
    canApply: typeof row.canApply === 'boolean' ? row.canApply : undefined,
    applyBlockedMessage: row.applyBlockedMessage != null ? asString(row.applyBlockedMessage) : undefined,
  }
}

export function parseAuthMe(raw: unknown): AuthMe {
  const row = asRecord(raw)
  const role = asString(row.role)
  return {
    userId: asString(row.id || row.userId),
    email: asString(row.email),
    nickname: row.nickname != null ? asString(row.nickname) : null,
    name: row.name != null ? asString(row.name) : null,
    displayName: row.displayName != null ? asString(row.displayName) : null,
    profileImageUrl: row.profileImageUrl != null ? asString(row.profileImageUrl) : null,
    role: (role === 'USER' ? 'APPLICANT' : role) as UserRole,
  }
}

export function parseMyApplicationList(raw: unknown): MyApplicationListItem[] {
  const page = asRecord(raw)
  const items = Array.isArray(page.items) ? page.items : []
  return items.map((item) => {
    const row = asRecord(item)
    return {
      id: asString(row.applicationId || row.id),
      auditionId: asString(row.auditionId),
      auditionTitle: asString(row.auditionTitle),
      status: asString(row.status, 'SUBMITTED') as ApplicationStatus,
      createdAt: asString(row.appliedAt || row.createdAt),
    }
  })
}

export function parseApplicationDetail(raw: unknown): ApplicationDetail {
  const row = asRecord(raw)
  const videos = Array.isArray(row.videos) ? row.videos : []
  const sns = Array.isArray(row.snsLinks) ? row.snsLinks : []
  return {
    id: asString(row.applicationId || row.id),
    auditionId: asString(row.auditionId),
    auditionTitle: asString(row.auditionTitle),
    status: asString(row.status, 'SUBMITTED') as ApplicationStatus,
    createdAt: asString(row.appliedAt || row.createdAt),
    name: row.name != null ? asString(row.name) : null,
    birthDate: row.birthDate != null ? asString(row.birthDate) : null,
    age: row.age != null ? asNumber(row.age) : null,
    nationality: row.nationality != null ? asString(row.nationality) : null,
    introText: row.introText != null ? asString(row.introText) : null,
    videoUrl: row.videoUrl != null ? asString(row.videoUrl) : null,
    snsLinks: sns.map((item) => {
      const s = asRecord(item)
      return { platform: asString(s.platform), url: asString(s.url) }
    }),
    processMode: asString(row.processMode, 'SINGLE'),
    currentRoundNumber: asNumber(row.currentRoundNumber, 1),
    maxRoundNumber: row.maxRoundNumber != null ? asNumber(row.maxRoundNumber) : null,
    roundSummaries: Array.isArray(row.roundSummaries)
      ? row.roundSummaries.map((item) => {
          const r = asRecord(item)
          return { roundId: asString(r.roundId), roundNumber: asNumber(r.roundNumber) }
        })
      : [],
    videos: videos.map((item) => {
      const v = asRecord(item)
      return {
        id: asString(v.videoId || v.id),
        title: asString(v.title),
        videoUrl: asString(v.videoUrl),
        thumbnailUrl: v.thumbnailUrl != null ? asString(v.thumbnailUrl) : null,
      }
    }),
  }
}

export function parseVotePage(raw: unknown): PublicVotesPage {
  const body = asRecord(raw)
  const audition = asRecord(body.audition)
  const summary = asRecord(body.summary)
  const items = Array.isArray(body.items) ? body.items : []
  const categories = Array.isArray(audition.categories) ? audition.categories : []
  return {
    audition: {
      id: asString(audition.id),
      title: asString(audition.title),
      description: asString(audition.description),
      applicantCount: asNumber(audition.applicantCount),
      totalVotes: asNumber(audition.totalVotes),
      categories: categories.map((item) => {
        const c = asRecord(item)
        return { name: asString(c.name), count: asNumber(c.count) }
      }),
    },
    summary: {
      applicantCount: asNumber(summary.applicantCount),
      totalVotes: asNumber(summary.totalVotes),
      totalViewCount: asNumber(summary.totalViewCount),
      myVoteCount: asNumber(summary.myVoteCount),
    },
    myVoteApplicationId: asString(body.myVoteApplicationId) || null,
    items: items.map((item) => parseVoteItem(item)),
  }
}

export function parseVoteItem(raw: unknown): PublicVoteItem {
  const row = asRecord(raw)
  return {
    applicationId: asString(row.applicationId),
    userName: asString(row.userName),
    userEmail: asString(row.userEmail),
    description: asString(row.description),
    videoUrl: asString(row.videoUrl),
    thumbnailUrl: row.thumbnailUrl != null ? asString(row.thumbnailUrl) : null,
    category: asString(row.category),
    voteCount: asNumber(row.voteCount),
    viewCount: asNumber(row.viewCount),
    isVoted: Boolean(row.isVoted),
    rank: asNumber(row.rank),
    status: row.status != null ? asString(row.status) : undefined,
  }
}

export function parseManageApplications(raw: unknown): ManageApplicationsPayload {
  const body = asRecord(raw)
  const audition = asRecord(body.audition)
  const stats = asRecord(body.stats)
  const items = Array.isArray(body.items) ? body.items : []
  return {
    audition: {
      id: asString(audition.id),
      title: asString(audition.title),
      description: asString(audition.description),
      processMode: asString(audition.processMode, 'SINGLE'),
      maxRoundNumber: audition.maxRoundNumber != null ? asNumber(audition.maxRoundNumber) : null,
    },
    stats: {
      total: asNumber(stats.total),
      submitted: asNumber(stats.submitted),
      reviewing: asNumber(stats.reviewing),
      accepted: asNumber(stats.accepted),
      rejected: asNumber(stats.rejected),
    },
    maxRound: Math.max(1, asNumber(body.maxRound, 1)),
    items: items.map((item) => {
      const r = asRecord(item)
      return {
        applicationId: asString(r.applicationId),
        userName: asString(r.userName),
        name: asString(r.name || r.userName),
        userEmail: asString(r.userEmail),
        videoUrl: asString(r.videoUrl),
        thumbnailUrl: r.thumbnailUrl != null ? asString(r.thumbnailUrl) : null,
        category: asString(r.category),
        viewCount: asNumber(r.viewCount),
        likeCount: asNumber(r.likeCount),
        voteCount: asNumber(r.voteCount),
        age: r.age != null ? asNumber(r.age) : null,
        nationality: r.nationality != null ? asString(r.nationality) : null,
        snsCount: asNumber(r.snsCount),
        round: asNumber(r.round, 1),
        createdAt: r.createdAt != null ? asString(r.createdAt) : null,
        status: asString(r.status, 'PENDING') as ManageApplicationsPayload['items'][number]['status'],
      }
    }),
  }
}

export function parseAgencyDetail(raw: unknown): ApplicationAgencyDetail {
  const d = asRecord(raw)
  const sns = Array.isArray(d.snsLinks) ? d.snsLinks : []
  return {
    id: asString(d.id),
    auditionId: asString(d.auditionId),
    name: asString(d.name),
    birthDate: d.birthDate != null ? asString(d.birthDate) : null,
    age: d.age != null ? asNumber(d.age) : null,
    nationality: d.nationality != null ? asString(d.nationality) : null,
    videoUrl: asString(d.videoUrl),
    thumbnailUrl: d.thumbnailUrl != null ? asString(d.thumbnailUrl) : null,
    introText: d.introText != null ? asString(d.introText) : null,
    status: asString(d.status, 'PENDING') as ApplicationAgencyDetail['status'],
    round: asNumber(d.round, 1),
    createdAt: d.createdAt != null ? asString(d.createdAt) : null,
    snsLinks: sns.map((item) => {
      const s = asRecord(item)
      return { platform: asString(s.platform), url: asString(s.url) }
    }),
  }
}

export function parseApplicantDashboard(raw: unknown): ApplicantDashboard {
  const d = asRecord(raw)
  const stats = asRecord(d.stats)
  return {
    applied: asNumber(stats.appliedCount),
    reviewed: asNumber(stats.reviewingCount),
    accepted: asNumber(stats.acceptedCount),
    rejected: asNumber(stats.rejectedCount),
    videosCount: asNumber(stats.videoCount),
  }
}

export function parseRankingItems(raw: unknown): RankingItem[] {
  const body = asRecord(raw)
  const items = Array.isArray(body.items) ? body.items : []
  return items.map((item) => {
    const r = asRecord(item)
    return {
      applicationId: asString(r.applicationId),
      userName: asString(r.userName),
      category: asString(r.category),
      voteCount: asNumber(r.voteCount),
      viewCount: asNumber(r.viewCount),
      status: asString(r.status),
      rank: asNumber(r.rank),
    }
  })
}
