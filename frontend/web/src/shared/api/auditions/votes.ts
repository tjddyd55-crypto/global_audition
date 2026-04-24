import { auditionApi } from '../auditions'

/** 공개 투표/조회수 API 경계. */
export const auditionVoteApi = {
  listVotes: auditionApi.listVotes,
  vote: auditionApi.vote,
  cancelVote: auditionApi.cancelVote,
  bumpApplicationView: auditionApi.bumpApplicationView,
}
