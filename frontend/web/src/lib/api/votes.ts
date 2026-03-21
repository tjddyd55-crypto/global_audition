import { apiClient } from './client'
import { unwrapData } from './unwrap'

export type PublicVoteItem = {
  applicationId: string
  userName: string
  description: string
  videoUrl: string
  thumbnailUrl: string | null
  category: string
  voteCount: number
  viewCount: number
  isVoted: boolean
}

export type AuditionVotesPayload = {
  totalVotes: number
  myVote: string | null
  items: PublicVoteItem[]
}

function parseItem(raw: Record<string, unknown>): PublicVoteItem {
  return {
    applicationId: String(raw.applicationId ?? ''),
    userName: String(raw.userName ?? ''),
    description: raw.description != null ? String(raw.description) : '',
    videoUrl: String(raw.videoUrl ?? ''),
    thumbnailUrl: raw.thumbnailUrl != null ? String(raw.thumbnailUrl) : null,
    category: String(raw.category ?? ''),
    voteCount: Number(raw.voteCount ?? 0) || 0,
    viewCount: Number(raw.viewCount ?? 0) || 0,
    isVoted: Boolean(raw.isVoted),
  }
}

export const votesApi = {
  list: async (auditionId: string): Promise<AuditionVotesPayload> => {
    const { data } = await apiClient.get<unknown>(`/auditions/${auditionId}/votes`)
    const body = unwrapData<Record<string, unknown>>(data)
    const itemsRaw = Array.isArray(body.items) ? body.items : []
    return {
      totalVotes: Number(body.totalVotes ?? 0) || 0,
      myVote: body.myVote != null && String(body.myVote).length > 0 ? String(body.myVote) : null,
      items: itemsRaw.map((x) => parseItem(x as Record<string, unknown>)),
    }
  },

  cast: async (applicationId: string): Promise<{ applicationId: string }> => {
    const { data } = await apiClient.post<unknown>('/votes', { applicationId })
    return unwrapData<{ applicationId: string }>(data)
  },

  remove: async (applicationId: string): Promise<void> => {
    const { data } = await apiClient.delete<unknown>(`/votes/${applicationId}`)
    unwrapData<boolean>(data)
  },
}
