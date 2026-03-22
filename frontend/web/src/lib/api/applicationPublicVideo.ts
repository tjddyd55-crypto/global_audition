import { apiClient } from './client'
import { unwrapData } from './unwrap'

export type ApplicationPublicDetail = {
  applicationId: string
  auditionId: string
  title: string
  videoUrl: string
  thumbnailUrl: string | null
  category: string
  viewCount: number
  likeCount: number
  isLiked: boolean
  isVoted: boolean
  description: string
  channelDisplayName: string
  channelProfileImageUrl: string | null
  subscriberCount: number
  publishedAt: string
}

export type ApplicationRecommendItem = {
  applicationId: string
  title: string
  thumbnailUrl: string | null
  channelDisplayName: string
  viewCount: number
  publishedAt: string
}

export type ApplicationCommentRow = {
  id: string
  authorDisplayName: string
  authorProfileImageUrl: string | null
  content: string
  createdAt: string
}

export type LikeToggleResult = {
  likeCount: number
  isLiked: boolean
}

export async function bumpApplicationViewPublic(applicationId: string): Promise<void> {
  const { data } = await apiClient.post<unknown>(`/applications/${applicationId}/view`)
  unwrapData<boolean>(data)
}

export async function fetchApplicationPublic(applicationId: string): Promise<ApplicationPublicDetail> {
  const { data } = await apiClient.get<unknown>(`/applications/${applicationId}/public`)
  const raw = unwrapData<Record<string, unknown>>(data)
  return parsePublicDetail(raw)
}

function parsePublicDetail(raw: Record<string, unknown>): ApplicationPublicDetail {
  return {
    applicationId: String(raw.applicationId ?? ''),
    auditionId: String(raw.auditionId ?? ''),
    title: String(raw.title ?? ''),
    videoUrl: String(raw.videoUrl ?? ''),
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    category: String(raw.category ?? ''),
    viewCount: Number(raw.viewCount ?? 0) || 0,
    likeCount: Number(raw.likeCount ?? 0) || 0,
    isLiked: Boolean(raw.isLiked),
    isVoted: Boolean(raw.isVoted),
    description: String(raw.description ?? ''),
    channelDisplayName: String(raw.channelDisplayName ?? ''),
    channelProfileImageUrl: raw.channelProfileImageUrl != null ? String(raw.channelProfileImageUrl) : null,
    subscriberCount: Number(raw.subscriberCount ?? 0) || 0,
    publishedAt: String(raw.publishedAt ?? ''),
  }
}

export async function listApplicationsExclude(excludeApplicationId: string): Promise<ApplicationRecommendItem[]> {
  const { data } = await apiClient.get<unknown>('/applications', {
    params: { exclude: excludeApplicationId },
  })
  const arr = unwrapData<unknown[]>(data)
  if (!Array.isArray(arr)) return []
  return arr.map((x) => {
    const r = x as Record<string, unknown>
    return {
      applicationId: String(r.applicationId ?? ''),
      title: String(r.title ?? ''),
      thumbnailUrl: r.thumbnailUrl != null ? String(r.thumbnailUrl) : null,
      channelDisplayName: String(r.channelDisplayName ?? ''),
      viewCount: Number(r.viewCount ?? 0) || 0,
      publishedAt: String(r.publishedAt ?? ''),
    }
  })
}

export async function listApplicationComments(applicationId: string): Promise<ApplicationCommentRow[]> {
  const { data } = await apiClient.get<unknown>('/comments', { params: { applicationId } })
  const arr = unwrapData<unknown[]>(data)
  if (!Array.isArray(arr)) return []
  return arr.map((x) => {
    const r = x as Record<string, unknown>
    return {
      id: String(r.id ?? ''),
      authorDisplayName: String(r.authorDisplayName ?? ''),
      authorProfileImageUrl: r.authorProfileImageUrl != null ? String(r.authorProfileImageUrl) : null,
      content: String(r.content ?? ''),
      createdAt: String(r.createdAt ?? ''),
    }
  })
}

export async function postApplicationComment(applicationId: string, content: string): Promise<ApplicationCommentRow> {
  const { data } = await apiClient.post<unknown>('/comments', { applicationId, content })
  const raw = unwrapData<Record<string, unknown>>(data)
  return {
    id: String(raw.id ?? ''),
    authorDisplayName: String(raw.authorDisplayName ?? ''),
    authorProfileImageUrl: raw.authorProfileImageUrl != null ? String(raw.authorProfileImageUrl) : null,
    content: String(raw.content ?? ''),
    createdAt: String(raw.createdAt ?? ''),
  }
}

export async function postApplicationLike(applicationId: string): Promise<LikeToggleResult> {
  const { data } = await apiClient.post<unknown>('/likes', { applicationId })
  const raw = unwrapData<Record<string, unknown>>(data)
  return {
    likeCount: Number(raw.likeCount ?? 0) || 0,
    isLiked: Boolean(raw.isLiked),
  }
}

export async function deleteApplicationLike(applicationId: string): Promise<LikeToggleResult> {
  const { data } = await apiClient.delete<unknown>(`/likes/${applicationId}`)
  const raw = unwrapData<Record<string, unknown>>(data)
  return {
    likeCount: Number(raw.likeCount ?? 0) || 0,
    isLiked: Boolean(raw.isLiked),
  }
}
