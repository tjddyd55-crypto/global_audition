import { auditionApi } from '../auditions'

/** 공개 오디션 조회 API 경계. */
export const publicAuditionApi = {
  listOpen: auditionApi.listOpen,
  getById: auditionApi.getById,
}

export const listOpenAuditions = auditionApi.listOpen
export const getAuditionById = auditionApi.getById
