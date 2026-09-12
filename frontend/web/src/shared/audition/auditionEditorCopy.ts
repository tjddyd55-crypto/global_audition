import type { AuditionStatus } from '@/shared/types/audition'

const EDITOR_STATUS_KEYS: Record<AuditionStatus, 'statusDraft' | 'statusOpen' | 'statusClosed'> = {
  DRAFT: 'statusDraft',
  OPEN: 'statusOpen',
  CLOSED: 'statusClosed',
}

/** 에디터 미리보기 상태 라벨. 카탈로그 editor.* 키를 반환한다. */
export function editorStatusMessageKey(status: string): 'statusDraft' | 'statusOpen' | 'statusClosed' | null {
  if (status === 'DRAFT' || status === 'OPEN' || status === 'CLOSED') {
    return EDITOR_STATUS_KEYS[status]
  }
  return null
}
