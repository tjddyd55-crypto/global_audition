import type { AgencyBoardStatus } from '@/shared/api/auditions'

const STATUS_KEYS: Record<AgencyBoardStatus, 'underReview' | 'accepted' | 'rejected' | 'pending'> = {
  REVIEWING: 'underReview',
  APPROVED: 'accepted',
  REJECTED: 'rejected',
  PENDING: 'pending',
}

export function nationalityCatalogKey(code?: string | null): 'KR' | 'MN' | 'JP' | 'OTHER' | 'unspecified' {
  if (code === 'KR' || code === 'MN' || code === 'JP' || code === 'OTHER') return code
  return 'unspecified'
}

export function snsPlatformLabel(platform: string, otherLabel: string): string {
  const map: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    twitter: 'X',
    facebook: 'Facebook',
    other: otherLabel,
  }
  return map[platform] ?? platform
}

export function applicantStatusMessageKey(status: AgencyBoardStatus) {
  return STATUS_KEYS[status] ?? 'pending'
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
