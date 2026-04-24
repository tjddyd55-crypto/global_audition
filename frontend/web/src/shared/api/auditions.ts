import { parseAuditionDto } from './auditions/parsers'
import { listOpenAuditions, getAuditionById } from './auditions/public'
import {
  listAuditionVotes,
  voteAudition,
  cancelAuditionVote,
  bumpAuditionApplicationView,
} from './auditions/votes'
import { getAuditionRanking } from './auditions/ranking'
import { createNextSeriesRoundAudition } from './auditions/series'
import {
  createAudition,
  updateAudition,
  deleteAudition,
  getMyAuditions,
  listManageApplications,
  getApplicationAgencyDetail,
  updateApplicationStatus,
} from './auditions/manage'
import type { ManageListFilters } from './auditions/types'

/** @deprecated 레거시 import 호환 — AuditionDto와 동일 */
export type { AuditionDto as AuditionResponse } from '../types/audition'
export type {
  VotePageCategory,
  PublicVoteItem,
  PublicVotesPagePayload,
  ManageApplicationStats,
  AgencyBoardStatus,
  ManageApplicantItem,
  ManageListFilters,
  ApplicationAgencyDetail,
  ManageRoundCount,
  ManageAuditionHeader,
  ManageApplicationsPayload,
  RankingItem,
} from './auditions/types'
export { parseAuditionDto }

export const auditionApi = {
  listOpen: listOpenAuditions,
  getById: getAuditionById,
  create: createAudition,
  update: updateAudition,
  deleteAudition,
  getMyAuditions,
  /** 기획사·관리자: 동일 시리즈 다음 차 공고 생성(DRAFT) */
  createNextSeriesRound: createNextSeriesRoundAudition,
  /** 공개 투표 목록 (비로그인 조회 가능) */
  listVotes: listAuditionVotes,
  vote: voteAudition,
  cancelVote: cancelAuditionVote,
  /** 투표 카드 영상 재생 시 대표 영상 조회수 +1 (세션당 1회 제한은 프론트에서 처리) */
  bumpApplicationView: bumpAuditionApplicationView,
  getRanking: getAuditionRanking,
  /** AGENCY/ADMIN: 지원자 관리 화면 */
  listManageApplications,
  getApplicationAgencyDetail,
  updateApplicationStatus,
}

/** 스펙 문서용 별칭 — {@link auditionApi.listManageApplications} 와 동일 */
export function getManageList(auditionId: string, filters?: ManageListFilters | string | null) {
  return auditionApi.listManageApplications(auditionId, filters)
}
