/**
 * @deprecated auditionApi.listVotes / vote / cancelVote 사용 권장
 */
import { auditionApi, type PublicVoteItem, type PublicVotesPagePayload } from './auditions'

export type { PublicVoteItem, PublicVotesPagePayload }

export const votesApi = {
  list: (auditionId: string, category?: string | null): Promise<PublicVotesPagePayload> =>
    auditionApi.listVotes(auditionId, category),
  cast: (auditionId: string, applicationId: string) => auditionApi.vote(auditionId, applicationId),
  remove: (applicationId: string) => auditionApi.cancelVote(applicationId),
}
