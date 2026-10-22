import type { AuditionDto } from '@/shared/types/audition'
import type { ContentTranslationView } from '@/shared/i18n/contentTranslation'

const LIST_FIELDS = ['recruitFields', 'qualifications', 'schedules', 'benefits'] as const

type ListField = (typeof LIST_FIELDS)[number]

/** 저장된 공고 번역 또는 원문 스냅샷을 표시 필드에만 덮는다. 이름·날짜·금액은 그대로다. */
export function overlayPosting(audition: AuditionDto, view: ContentTranslationView | null | undefined): AuditionDto {
  if (!view?.fields) return audition
  const next: AuditionDto = { ...audition }
  const title = fieldText(view, 'title')
  const description = fieldText(view, 'description')
  if (title) next.title = title
  if (description) next.description = description
  for (const field of LIST_FIELDS) {
    const lines = fieldLines(view, field)
    if (lines) next[field] = lines
  }
  return next
}

function fieldText(view: ContentTranslationView, field: string): string {
  return (view.fields?.[field] ?? '').trim()
}

function fieldLines(view: ContentTranslationView, field: ListField): string[] | null {
  const raw = view.fields?.[field]
  if (!raw || !raw.trim()) return null
  return raw.split('\n').map((line) => line.trim()).filter((line) => line.length > 0)
}
