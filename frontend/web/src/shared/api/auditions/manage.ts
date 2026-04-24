import { auditionApi } from '../auditions'

/** 기획사/관리자 오디션 관리 API 경계. */
export const manageAuditionApi = {
  create: auditionApi.create,
  update: auditionApi.update,
  deleteAudition: auditionApi.deleteAudition,
  getMyAuditions: auditionApi.getMyAuditions,
  listManageApplications: auditionApi.listManageApplications,
  getApplicationAgencyDetail: auditionApi.getApplicationAgencyDetail,
  updateApplicationStatus: auditionApi.updateApplicationStatus,
}
