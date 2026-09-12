import type { AuditionDto } from '../api/types'
import i18n from '../i18n'

function t(key: string, params?: Record<string, unknown>): string {
  return i18n.t(key, params)
}

export function auditionStatusBadgeLabel(status: string): string {
  if (status === 'OPEN') return t('status.open')
  if (status === 'CLOSED') return t('status.closed')
  if (status === 'DRAFT') return t('status.draft')
  return status
}

export function auditionRoundBadgeLabel(recruitmentRoundLabel?: string | null): string | null {
  const label = recruitmentRoundLabel?.trim()
  return label && label.length > 0 ? label : null
}

export function auditionDdayLabel(remainingDays: number): string {
  if (remainingDays <= 0) return t('auditions.deadline')
  return t('auditions.daysLeft', { n: remainingDays })
}

export function auditionBadgeMeta(audition: Pick<AuditionDto, 'status' | 'recruitmentRoundLabel' | 'remainingDays'>) {
  return {
    statusLabel: auditionStatusBadgeLabel(audition.status),
    roundLabel: auditionRoundBadgeLabel(audition.recruitmentRoundLabel),
    ddayLabel: auditionDdayLabel(audition.remainingDays),
  }
}
