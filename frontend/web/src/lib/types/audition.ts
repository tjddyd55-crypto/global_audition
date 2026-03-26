/**
 * SSOT (5-way 동기화): Flyway auditions · JPA Audition · API DTO · prisma/schema.prisma · 본 타입
 * 배열 필드: tags, recruitFields, qualifications, schedules, benefits, galleryImages — JSON/detail_content 없음
 */
export type AuditionStatus = 'DRAFT' | 'OPEN' | 'CLOSED'

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
  coverImage?: string | null
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
  coverImage?: string
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
