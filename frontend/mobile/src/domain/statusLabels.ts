/**
 * 백엔드/웹에 이미 있는 상태 문자열의 표시 라벨만 담당한다.
 * 새로운 상태 enum을 만들지 않는다. UI 라벨은 카탈로그 SSOT.
 */

import type { AgencyBoardStatus, ApplicationStatus } from '../api/types'
import i18n from '../i18n'

function t(key: string): string {
  return i18n.t(key)
}

export function auditionStatusLabel(status: string, recruitmentRoundLabel?: string): string {
  if (status === 'OPEN' && recruitmentRoundLabel?.trim()) return recruitmentRoundLabel.trim()
  if (status === 'OPEN') return t('status.open')
  if (status === 'CLOSED') return t('status.closed')
  if (status === 'DRAFT') return t('status.draft')
  return status
}

export function applicationStatusLabel(status: string): string {
  if (status === 'ACCEPTED') return t('status.accepted')
  if (status === 'REJECTED') return t('status.rejected')
  if (status === 'SUBMITTED') return t('status.submitted')
  if (status === 'REVIEWING' || status === 'REVIEWED') return t('status.reviewing')
  return status
}

export function agencyBoardStatusLabel(status: AgencyBoardStatus | string): string {
  if (status === 'REVIEWING') return t('status.reviewing')
  if (status === 'APPROVED') return t('status.approved')
  if (status === 'REJECTED') return t('status.rejected')
  if (status === 'PENDING') return t('status.pending')
  return status
}

export function agencyConfirmMessage(status: AgencyBoardStatus): string {
  if (status === 'APPROVED') return t('agency.confirmPass')
  if (status === 'REJECTED') return t('agency.confirmReject')
  if (status === 'REVIEWING') return t('agency.confirmReview')
  return t('agency.confirmChange')
}

export function applicationResultCopy(status: ApplicationStatus | string): string {
  if (status === 'ACCEPTED') return t('agency.resultAccepted')
  if (status === 'REJECTED') return t('agency.resultRejected')
  if (status === 'REVIEWING' || status === 'REVIEWED') return t('agency.resultReviewing')
  if (status === 'SUBMITTED') return t('agency.resultSubmitted')
  return ''
}

export function roundSubmissionLabel(status: string | null | undefined): string {
  if (!status) return ''
  if (status === 'NOT_SUBMITTED') return t('status.notSubmitted')
  if (status === 'SUBMITTED') return t('status.submitted')
  if (status === 'UNDER_REVIEW') return t('status.underReview')
  if (status === 'PASSED') return t('status.roundPass')
  if (status === 'FAILED') return t('status.roundFail')
  if (status === 'SKIPPED') return t('status.skipped')
  return status
}

export function nationalityLabel(code: string | null | undefined): string {
  if (code === 'KR') return t('nationality.KR')
  if (code === 'MN') return t('nationality.MN')
  if (code === 'JP') return t('nationality.JP')
  if (code === 'OTHER') return t('nationality.OTHER')
  return code ?? ''
}

export function snsPlatformLabel(platform: string): string {
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'tiktok') return 'TikTok'
  if (platform === 'youtube') return 'YouTube'
  if (platform === 'twitter') return 'X'
  if (platform === 'facebook') return 'Facebook'
  if (platform === 'other') return t('nationality.OTHER')
  return platform
}

export const ALLOWED_SNS_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'other'] as const
export const ALLOWED_NATIONALITIES = ['KR', 'MN', 'JP', 'OTHER'] as const
