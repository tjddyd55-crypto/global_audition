/**
 * SSOT: Prisma Audition / API / 상세 / 생성 폼 동일 필드명 (JSON detailContent 없음)
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
  galleryImages?: string[]
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
