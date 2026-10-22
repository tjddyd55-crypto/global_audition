import type { AuditionTranslationView } from '@/shared/api/auditions/translations'

export function translationTabLabel(
  row: AuditionTranslationView | undefined,
): 'complete' | 'pending' | 'failed' | 'stale' | 'missing' {
  if (!row || !row.title?.trim()) {
    if (row?.status === 'FAILED' || row?.attemptStatus === 'FAILED') return 'failed'
    if (row?.status === 'PENDING' || row?.attemptStatus === 'PENDING') return 'pending'
    return 'missing'
  }
  if (row.stale) return 'stale'
  if (row.status === 'FAILED') return 'failed'
  if (row.status === 'PENDING') return 'pending'
  if (row.status === 'COMPLETED') return 'complete'
  return 'missing'
}
