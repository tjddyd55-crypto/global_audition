import type { AuditionDto, AuditionImages } from '@/shared/types/audition'
import { safeStringArr } from '@/shared/utils/safe'
import type { PublicVoteItem } from './types'

export function parsePublicVoteItem(raw: Record<string, unknown>): PublicVoteItem {
  const recScore = raw.recommendedScore
  const recRank = raw.recommendedRank
  return {
    applicationId: String(raw.applicationId ?? ''),
    userName: String(raw.userName ?? ''),
    userEmail: String(raw.userEmail ?? ''),
    description: String(raw.description ?? ''),
    videoUrl: String(raw.videoUrl ?? ''),
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    category: String(raw.category ?? ''),
    voteCount: Number(raw.voteCount ?? 0) || 0,
    viewCount: Number(raw.viewCount ?? 0) || 0,
    isVoted: Boolean(raw.isVoted),
    rank: Number(raw.rank ?? 0) || 0,
    status: raw.status != null ? String(raw.status) : undefined,
    recommendedScore: recScore != null ? Number(recScore) : undefined,
    recommendedRank: recRank != null ? Number(recRank) : undefined,
    recommended: raw.recommended != null ? Boolean(raw.recommended) : undefined,
  }
}

function parseAuditionImages(raw: Record<string, unknown>): AuditionImages {
  const nest = raw.images
  if (nest && typeof nest === 'object' && !Array.isArray(nest)) {
    const n = nest as Record<string, unknown>
    const o = n.original != null ? String(n.original).trim() : ''
    const m = n.medium != null ? String(n.medium).trim() : ''
    const t = n.thumb != null ? String(n.thumb).trim() : ''
    if (o || m || t) {
      const base = o || m || t
      return {
        original: (o || base) || null,
        medium: (m || base) || null,
        thumb: (t || base) || null,
      }
    }
  }
  const legacy =
    (raw.coverImage != null && String(raw.coverImage).trim()) ||
    (raw.cover_image != null && String(raw.cover_image).trim()) ||
    (raw.imageUrl != null && String(raw.imageUrl).trim()) ||
    ''
  if (legacy) {
    return { original: legacy, medium: legacy, thumb: legacy }
  }
  return { original: null, medium: null, thumb: null }
}

export function parseAuditionDto(raw: Record<string, unknown>): AuditionDto {
  const tagRefsRaw = raw.tagRefs
  const tagRefs = Array.isArray(tagRefsRaw)
    ? (tagRefsRaw as Record<string, unknown>[]).map((row) => {
        const tid = row.tagId != null ? String(row.tagId) : ''
        return {
          tagId: tid.length > 0 ? tid : null,
          name: String(row.name ?? '').trim(),
        }
      }).filter((r) => r.name.length > 0)
    : undefined

  return {
    id: String(raw.id ?? ''),
    ownerId: String(raw.ownerId ?? ''),
    title: String(raw.title ?? ''),
    description: String(raw.description ?? ''),
    status: String(raw.status ?? 'DRAFT'),
    updatedAt: raw.updatedAt != null ? String(raw.updatedAt) : undefined,
    countryCode: raw.countryCode != null ? String(raw.countryCode) : null,
    deadlineAt: raw.deadlineAt != null ? String(raw.deadlineAt) : null,
    tags: safeStringArr(raw.tags),
    tagRefs: tagRefs && tagRefs.length > 0 ? tagRefs : undefined,
    createdAt: String(raw.createdAt ?? ''),
    images: parseAuditionImages(raw),
    videoUrl: raw.videoUrl != null ? String(raw.videoUrl) : null,
    galleryImages: safeStringArr(raw.galleryImages),
    agencyName: String(raw.agencyName ?? ''),
    agencyLogo: raw.agencyLogo != null ? String(raw.agencyLogo) : null,
    applicantsCount: Number(raw.applicantsCount ?? 0) || 0,
    remainingDays: Number(raw.remainingDays ?? 0) || 0,
    recruitFields: safeStringArr(raw.recruitFields),
    qualifications: safeStringArr(raw.qualifications),
    schedules: safeStringArr(raw.schedules),
    location: String(raw.location ?? ''),
    startDate: String(raw.startDate ?? ''),
    endDate: String(raw.endDate ?? ''),
    benefits: safeStringArr(raw.benefits),
    hasApplied: raw.hasApplied === true ? true : raw.hasApplied === false ? false : undefined,
    processMode: raw.processMode != null ? String(raw.processMode) : 'SINGLE',
    myApplicationId:
      raw.myApplicationId != null && String(raw.myApplicationId).length > 0
        ? String(raw.myApplicationId)
        : null,
    myCurrentRoundNumber:
      raw.myCurrentRoundNumber != null && Number.isFinite(Number(raw.myCurrentRoundNumber))
        ? Number(raw.myCurrentRoundNumber)
        : null,
    roundSummaries: Array.isArray(raw.roundSummaries)
      ? (raw.roundSummaries as Record<string, unknown>[]).map((row) => ({
          roundId: String(row.roundId ?? ''),
          roundNumber: Number(row.roundNumber ?? 0) || 0,
        }))
      : [],
    groupId: raw.groupId != null && String(raw.groupId).length > 0 ? String(raw.groupId) : undefined,
    round:
      raw.round != null && Number.isFinite(Number(raw.round))
        ? Number(raw.round)
        : raw.seriesRound != null && Number.isFinite(Number(raw.seriesRound))
          ? Number(raw.seriesRound)
          : 1,
    displayTitle: raw.displayTitle != null ? String(raw.displayTitle).trim() || undefined : undefined,
    recruitmentRoundLabel:
      raw.recruitmentRoundLabel != null ? String(raw.recruitmentRoundLabel).trim() || undefined : undefined,
    canApply: raw.canApply === true ? true : raw.canApply === false ? false : undefined,
    applyBlockedMessage:
      raw.applyBlockedMessage != null ? String(raw.applyBlockedMessage) : undefined,
  }
}
