/**
 * SSOT (5-way 동기화): Flyway auditions · JPA Audition · API DTO · prisma/schema.prisma · 본 타입
 * 배열 필드: recruitFields, qualifications, schedules, benefits, galleryImages — JSON/detail_content 없음
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
  category: string
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
}

export type CreateAuditionPayload = {
  title: string
  description: string
  status: AuditionStatus
  category: string
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
