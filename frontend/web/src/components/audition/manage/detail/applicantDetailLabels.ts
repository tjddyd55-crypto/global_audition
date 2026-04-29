import type { AgencyBoardStatus } from '@/shared/api/auditions'

export const APPLICANT_NATIONALITY_LABEL: Record<string, string> = {
  KR: '대한민국',
  MN: '몽골',
  JP: '일본',
  OTHER: '기타',
}

export const APPLICANT_SNS_PLATFORM_LABEL: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  twitter: 'X',
  facebook: 'Facebook',
  other: '기타',
}

export function applicantStatusLabel(status: AgencyBoardStatus) {
  if (status === 'REVIEWING') return '검토중'
  if (status === 'APPROVED') return '합격'
  if (status === 'REJECTED') return '불합격'
  return '대기'
}

export function applicantCurrentStatusEmphasisClass(status: AgencyBoardStatus) {
  if (status === 'APPROVED') return 'text-green-700'
  if (status === 'REJECTED') return 'text-red-700'
  if (status === 'REVIEWING') return 'text-blue-700'
  return 'text-amber-800'
}

export function applicantStatusBadgeClass(status: AgencyBoardStatus) {
  if (status === 'REVIEWING') return 'bg-blue-50 text-blue-700'
  if (status === 'APPROVED') return 'bg-green-50 text-green-700'
  if (status === 'REJECTED') return 'bg-red-50 text-red-700'
  return 'bg-amber-50 text-amber-800'
}
