import type { AuditionStatus } from '@/lib/types/audition'

/** API 값 유지 — 화면에만 한글 표기 */
export const AUDITION_STATUS_LABEL_KO: Record<AuditionStatus, string> = {
  DRAFT: '임시저장',
  OPEN: '게시중',
  CLOSED: '마감',
}

export function auditionStatusLabelKo(status: string): string {
  if (status === 'DRAFT' || status === 'OPEN' || status === 'CLOSED') {
    return AUDITION_STATUS_LABEL_KO[status]
  }
  return status
}

export const EDITOR_LABELS = {
  title: '제목',
  description: '상세 설명',
  status: '상태',
  tags: '태그',
  tagsHint: '검색·필터에 쓰입니다. 여러 개 선택할 수 있습니다.',
  coverImage: '대표 이미지',
  videoUrl: 'YouTube 영상 링크',
  galleryImages: '갤러리 이미지',
  agencyName: '기획사명',
  agencyLogo: '기획사 로고',
  location: '위치 · 장소',
  startDate: '모집 시작일시',
  endDate: '모집 종료일시',
  recruitFields: '모집 분야',
  qualifications: '지원 자격',
  schedules: '일정 안내',
  benefits: '혜택',
  previewTitle: '미리보기',
  previewHint: '입력 내용은 저장 전에도 여기에 바로 반영됩니다. 실제 목록·상세 노출은 저장 후 상태에 따라 달라집니다.',
  sectionBasic: '기본 정보',
  sectionMedia: '미디어',
  sectionAgency: '기획사',
  sectionSchedule: '위치 · 일정',
  sectionLists: '모집 · 자격 · 일정',
  sectionBenefits: '혜택',
} as const
