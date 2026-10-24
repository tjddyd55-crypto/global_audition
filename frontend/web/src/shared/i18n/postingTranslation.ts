import type { AuditionDto } from '@/shared/types/audition'
import type { ContentTranslationView } from '@/shared/i18n/contentTranslation'

// recruitFields 는 카탈로그 코드(VOCAL 등)라 기계번역본을 쓰지 않고 원래 코드를 카탈로그 라벨로 번역한다.
const LIST_FIELDS = ['qualifications', 'schedules', 'benefits'] as const

type ListField = (typeof LIST_FIELDS)[number]

/** 저장된 공고 번역 또는 원문 스냅샷을 표시 필드에만 덮는다. 이름·날짜·금액은 그대로다. */
export function overlayPosting(audition: AuditionDto, view: ContentTranslationView | null | undefined): AuditionDto {
  if (!view?.fields) return audition
  const next: AuditionDto = { ...audition }
  const title = fieldText(view, 'title')
  const description = fieldText(view, 'description')
  if (title && title !== audition.title) {
    next.title = title
    // displayTitle 은 원래 제목 + 회차 접미사다. 접미사는 유지하고 제목 부분만 바꾼다.
    const display = audition.displayTitle?.trim()
    if (display && display.startsWith(audition.title)) {
      next.displayTitle = title + display.slice(audition.title.length)
    } else {
      next.displayTitle = undefined
    }
  }
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
