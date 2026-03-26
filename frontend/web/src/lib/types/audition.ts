/**
 * SSOT (5-way 동기화): Flyway auditions · JPA Audition · API DTO · prisma/schema.prisma · 본 타입
 * 배열 필드: tags, recruitFields, qualifications, schedules, benefits, galleryImages — JSON/detail_content 없음
 */
export type AuditionStatus = 'DRAFT' | 'OPEN' | 'CLOSED'

/** API·DB 대표 이미지 — R2 업로드 `urls` 키와 동일 */
export type AuditionImages = {
  original: string | null
  medium: string | null
  thumb: string | null
}

const EMPTY_API_IMAGES: AuditionImages = { original: null, medium: null, thumb: null }

/** API 파싱 후 `images` 없음·null 방어 */
export function normalizeAuditionImages(im?: AuditionImages | null): AuditionImages {
  return im ?? EMPTY_API_IMAGES
}

/** 리스트: thumb → medium → original (원본 단독 사용 금지) */
export function auditionListImageUrl(im?: AuditionImages | null): string {
  const i = normalizeAuditionImages(im)
  return (i.thumb || i.medium || i.original || '').trim()
}

/** 상세 히어로: medium → original → thumb */
export function auditionDetailMediumUrl(im?: AuditionImages | null): string {
  const i = normalizeAuditionImages(im)
  return (i.medium || i.original || i.thumb || '').trim()
}

/** 확대·원본 링크: original → medium */
export function auditionDetailOriginalUrl(im?: AuditionImages | null): string {
  const i = normalizeAuditionImages(im)
  return (i.original || i.medium || '').trim()
}

/** 에디터 폼: 업로드 응답 `urls` 와 동일 키 — setImages({ ...res.urls }) 패턴 */
export type AuditionFormImages = {
  original: string
  medium: string
  thumb: string
}

export const EMPTY_AUDITION_FORM_IMAGES: AuditionFormImages = {
  original: '',
  medium: '',
  thumb: '',
}

export type AuditionDto = {
  id: string
  ownerId: string
  title: string
  description: string
  status: AuditionStatus | string
  updatedAt?: string
  countryCode?: string | null
  deadlineAt?: string | null
  /** 검색·필터용 태그 (허용 목록만 서버 저장) */
  tags: string[]
  createdAt: string
  images: AuditionImages
  videoUrl?: string | null
  /** parseAuditionDto 이후 항상 배열 (빈 배열 가능) */
  galleryImages: string[]
  agencyName: string
  agencyLogo?: string | null
  applicantsCount: number
  remainingDays: number
  recruitFields: string[]
  qualifications: string[]
  schedules: string[]
  location: string
  startDate: string
  endDate: string
  benefits: string[]
  /** 로그인 지원자/관리자일 때만: 해당 오디션 지원 여부 */
  hasApplied?: boolean
  /** SINGLE | MULTI_ROUND */
  processMode?: string
  /** MULTI_ROUND·지원 완료 시 본인 지원서 ID */
  myApplicationId?: string | null
  /** 지원자 현재 라운드 — 지원 완료 시 */
  myCurrentRoundNumber?: number | null
  /** MULTI_ROUND 라운드 목록 */
  roundSummaries?: Array<{ roundId: string; roundNumber: number }>
}

export type CreateAuditionPayload = {
  title: string
  description: string
  status: AuditionStatus
  /** 검색·필터용 태그 (허용 목록만 서버 저장) */
  tags: string[]
  /** 비우면 서버에서 대표 이미지 제거(빈 문자열 DTO) */
  images?: { original: string; medium: string; thumb: string }
  videoUrl?: string
  galleryImages: string[]
  agencyName: string
  agencyLogo?: string
  recruitFields: string[]
  qualifications: string[]
  schedules: string[]
  location: string
  startDate: string
  endDate: string
  benefits: string[]
  countryCode?: string
  deadlineAt?: string
}

/** 폼 state → API `images` (빈 값이면 세 필드 모두 빈 문자열로 보내 대표 이미지 제거) */
export function buildAuditionImagesPayload(state: AuditionFormImages): { original: string; medium: string; thumb: string } {
  const o = state.original.trim()
  const m = state.medium.trim()
  const t = state.thumb.trim()
  const primary = o || m || t
  if (!primary) return { original: '', medium: '', thumb: '' }
  return {
    original: o || primary,
    medium: m || primary,
    thumb: t || primary,
  }
}
