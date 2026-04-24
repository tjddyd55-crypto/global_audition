import type { AuditionDto, CreateAuditionPayload } from '../types/audition'
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
  createAudition as createAuditionManage,
  updateAudition as updateAuditionManage,
  deleteAudition as deleteAuditionManage,
  getMyAuditions as getMyAuditionsManage,
  listManageApplications as listManageApplicationsManage,
  getApplicationAgencyDetail as getApplicationAgencyDetailManage,
  updateApplicationStatus as updateApplicationStatusManage,
} from './auditions/manage'
import type {
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
  listOpen: async (): Promise<AuditionDto[]> => {
    return listOpenAuditions()
  },

  getById: async (id: string): Promise<AuditionDto> => {
    return getAuditionById(id)
  },

  create: async (body: CreateAuditionPayload): Promise<AuditionDto> => {
    return createAuditionManage(body)
  },

  /** 기획사·관리자: 동일 시리즈 다음 차 공고 생성(DRAFT) */
  createNextSeriesRound: async (id: string): Promise<AuditionDto> => {
    return createNextSeriesRoundAudition(id)
  },

  getMyAuditions: async (_params: { page?: number; size?: number } = {}): Promise<{ content: AuditionDto[]; totalPages: number }> => {
    return getMyAuditionsManage(_params)
  },

  update: async (
    id: string,
    body: Partial<CreateAuditionPayload> & Record<string, unknown>
  ): Promise<AuditionDto> => {
    return updateAuditionManage(id, body)
  },

  deleteAudition: async (id: string | number): Promise<void> => {
    return deleteAuditionManage(id)
  },

  /** 공개 투표 목록 (비로그인 조회 가능) */
  listVotes: async (auditionId: string, category?: string | null): Promise<PublicVotesPagePayload> => {
    return listAuditionVotes(auditionId, category)
  },

  vote: async (auditionId: string, applicationId: string): Promise<{ applicationId: string; replaced: boolean }> => {
    return voteAudition(auditionId, applicationId)
  },

  cancelVote: async (applicationId: string): Promise<void> => {
    return cancelAuditionVote(applicationId)
  },

  /** 투표 카드 영상 재생 시 대표 영상 조회수 +1 (세션당 1회 제한은 프론트에서 처리) */
  bumpApplicationView: async (applicationId: string): Promise<void> => {
    return bumpAuditionApplicationView(applicationId)
  },

  /** AGENCY/ADMIN: 지원자 관리 화면 */
  listManageApplications: async (
    auditionId: string,
    filters?: ManageListFilters | string | null
  ): Promise<ManageApplicationsPayload> => {
    return listManageApplicationsManage(auditionId, filters)
  },

  getApplicationAgencyDetail: async (applicationId: string): Promise<ApplicationAgencyDetail> => {
    return getApplicationAgencyDetailManage(applicationId)
  },

  updateApplicationStatus: async (
    applicationId: string,
    status: AgencyBoardStatus | 'ACCEPTED'
  ): Promise<{ applicationId: string; status: string }> => {
    return updateApplicationStatusManage(applicationId, status)
  },

  getRanking: async (auditionId: string): Promise<RankingItem[]> => {
    return getAuditionRanking(auditionId)
  },
}

/** 스펙 문서용 별칭 — {@link auditionApi.listManageApplications} 와 동일 */
export function getManageList(auditionId: string, filters?: ManageListFilters | string | null) {
  return auditionApi.listManageApplications(auditionId, filters)
}
