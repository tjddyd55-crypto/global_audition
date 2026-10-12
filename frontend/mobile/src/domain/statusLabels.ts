/**
 * 백엔드/웹에 이미 있는 상태 문자열의 표시 라벨만 담당한다.
 * 새로운 상태 enum을 만들지 않는다.
 */

import type { AgencyBoardStatus, ApplicationStatus } from '../api/types'

export function auditionStatusLabel(status: string, recruitmentRoundLabel?: string): string {
  if (status === 'OPEN' && recruitmentRoundLabel?.trim()) return recruitmentRoundLabel.trim()
  if (status === 'OPEN') return '모집중'
  if (status === 'CLOSED') return '마감'
  if (status === 'DRAFT') return '초안'
  return status
}

export function applicationStatusLabel(status: string): string {
  if (status === 'ACCEPTED') return '합격'
  if (status === 'REJECTED') return '불합격'
  if (status === 'SUBMITTED') return '제출'
  if (status === 'REVIEWING' || status === 'REVIEWED') return '검토중'
  return status
}

export function agencyBoardStatusLabel(status: AgencyBoardStatus | string): string {
  if (status === 'REVIEWING') return '검토중'
  if (status === 'APPROVED') return '합격'
  if (status === 'REJECTED') return '불합격'
  if (status === 'PENDING') return '대기'
  return status
}

export function agencyConfirmMessage(status: AgencyBoardStatus): string {
  if (status === 'APPROVED') return '이 지원자를 합격 처리하시겠습니까?'
  if (status === 'REJECTED') return '이 지원자를 불합격 처리하시겠습니까?'
  if (status === 'REVIEWING') return '이 지원자를 검토중 상태로 변경하시겠습니까?'
  return '상태를 변경하시겠습니까?'
}

export function applicationResultCopy(status: ApplicationStatus | string): string {
  if (status === 'ACCEPTED') return '이 오디션에서 합격했습니다. 다음 안내는 기획사 공지를 확인해 주세요.'
  if (status === 'REJECTED') return '이번에는 함께하지 못하게 되었습니다. 다음 기회에서 다시 만나요.'
  if (status === 'REVIEWING' || status === 'REVIEWED') return '기획사가 지원서를 살펴보고 있습니다.'
  if (status === 'SUBMITTED') return '지원서가 접수되었습니다. 결과가 나오면 이 화면에서 확인할 수 있습니다.'
  return ''
}

export function roundSubmissionLabel(status: string | null | undefined): string {
  if (!status) return ''
  if (status === 'NOT_SUBMITTED') return '미제출'
  if (status === 'SUBMITTED') return '제출됨'
  if (status === 'UNDER_REVIEW') return '검토중'
  if (status === 'PASSED') return '라운드 통과'
  if (status === 'FAILED') return '라운드 미통과'
  if (status === 'SKIPPED') return '생략'
  return status
}

export function nationalityLabel(code: string | null | undefined): string {
  if (code === 'KR') return '대한민국'
  if (code === 'MN') return '몽골'
  if (code === 'JP') return '일본'
  if (code === 'OTHER') return '기타'
  return code ?? ''
}

export function snsPlatformLabel(platform: string): string {
  if (platform === 'instagram') return 'Instagram'
  if (platform === 'tiktok') return 'TikTok'
  if (platform === 'youtube') return 'YouTube'
  if (platform === 'twitter') return 'X'
  if (platform === 'facebook') return 'Facebook'
  if (platform === 'other') return '기타'
  return platform
}

export const ALLOWED_SNS_PLATFORMS = ['instagram', 'tiktok', 'youtube', 'twitter', 'facebook', 'other'] as const
export const ALLOWED_NATIONALITIES = ['KR', 'MN', 'JP', 'OTHER'] as const
