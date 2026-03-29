/**
 * SSOT (5-way 동기화): Flyway auditions · JPA Audition · API DTO · prisma/schema.prisma · 본 타입
 * 배열 필드: recruitFields, qualifications, schedules, benefits, galleryImages — JSON/detail_content 없음.
 * 태그: 서버 `tags`(표시용 병합) + `tagRefs`(catalog id / 직입력 구분).
 */
import { stripImageUrlResizeParams } from '@/lib/utils/imageDisplayUrl'

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

/** 리스트·풀폭 카드: original → medium → thumb (저해상도 thumb 확대 방지) */
export function auditionListImageUrl(im?: AuditionImages | null): string {
  const i = normalizeAuditionImages(im)
  const raw = (i.original || i.medium || i.thumb || '').trim()
  return stripImageUrlResizeParams(raw)
}

/** 상세 히어로 표시: original → medium → thumb */
export function auditionDetailMediumUrl(im?: AuditionImages | null): string {
  const i = normalizeAuditionImages(im)
  const raw = (i.original || i.medium || i.thumb || '').trim()
  return stripImageUrlResizeParams(raw)
}

/** 확대·원본 링크: original → medium */
export function auditionDetailOriginalUrl(im?: AuditionImages | null): string {
  const i = normalizeAuditionImages(im)
  const raw = (i.original || i.medium || '').trim()
  return stripImageUrlResizeParams(raw)
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
  /** 검색·필터용 표시 태그 (catalog + 직입력 병합) */
  tags: string[]
  /** 폼 복원용 — 없으면 tags 문자열로 카탈로그 매칭 */
  tagRefs?: Array<{ tagId: string | null; name: string }>
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
  /** 시리즈 그룹 id (백엔드 groupId) */
  groupId?: string
  /** 시리즈 차수(1차·2차 독립 공고). MULTI_ROUND 의 myCurrentRoundNumber 와 별개 */
  round?: number
  /** 표시용 제목 "기본 (2차)" */
  displayTitle?: string
  /** 예: "2차 모집 중" */
  recruitmentRoundLabel?: string
  /** 상세 조회 + 지원자 로그인 시: 시리즈 이전 차 합격 여부 반영 */
  canApply?: boolean
  /** canApply=false 인데 2차 이상일 때 */
  applyBlockedMessage?: string
}

/** 시리즈(1·2차 공고) 지원 제한 안내 — API·기획과 동일 문구 */
export const PREV_ROUND_APPLY_BLOCKED_MSG = '이전 라운드 합격자만 지원 가능합니다'

export function auditionHeadlineTitle(a: Pick<AuditionDto, 'displayTitle' | 'title'>): string {
  const d = a.displayTitle?.trim()
  if (d) return d
  return a.title
}

export type CreateAuditionPayload = {
  title: string
  description: string
  status: AuditionStatus
  /** 활성 catalog 태그 id */
  tagIds: string[]
  /** 직접 입력 태그 */
  customTagNames: string[]
  /** @deprecated 레거시 전용 */
  tags?: string[]
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
