// 공통 타입 정의 (shared/types와 동기화)
export enum UserType {
  APPLICANT = 'APPLICANT',
  BUSINESS = 'BUSINESS',
}

export enum AuditionStatus {
  ONGOING = 'ONGOING',
  UNDER_SCREENING = 'UNDER_SCREENING',
  FINISHED = 'FINISHED',
  WAITING_OPENING = 'WAITING_OPENING',
  WRITING = 'WRITING',
}

export enum AuditionCategory {
  SINGER = 'SINGER',
  DANCER = 'DANCER',
  ACTOR = 'ACTOR',
  MODEL = 'MODEL',
  INSTRUMENT = 'INSTRUMENT',
}

export enum ApplicationStatus {
  WRITING = 'WRITING',
  INCOMPLETE_PAYMENT = 'INCOMPLETE_PAYMENT',
  APPLICATION_COMPLETED = 'APPLICATION_COMPLETED',
  CANCEL = 'CANCEL',
}

export enum ScreeningResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PENDING = 'PENDING',
}

export enum VideoType {
  YOUTUBE = 'YOUTUBE',
  UPLOAD = 'UPLOAD',
}

export interface Audition {
  id: number
  title: string
  titleEn?: string
  status: AuditionStatus
  category: AuditionCategory
  description?: string
  requirements?: string
  startDate: string
  endDate: string
  screeningDate1?: string
  screeningDate2?: string
  screeningDate3?: string
  announcementDate1?: string
  announcementDate2?: string
  announcementDate3?: string
  bannerUrl?: string
  posterUrl?: string
  posterKey?: string
  videoType?: VideoType
  videoUrl?: string
  videoKey?: string
  maxRounds?: number
  deadlineAt?: string
  businessId: number
  businessName?: string
  createdAt: string
  updatedAt: string
}

export interface Application {
  id: number
  auditionId: number
  auditionTitle?: string
  userId: number
  userName?: string
  status: ApplicationStatus
  currentStage?: number // 0=지원, 1=1차합격, 2=2차합격, 3=최종합격
  result1?: ScreeningResult
  result2?: ScreeningResult
  result3?: ScreeningResult
  finalResult?: ScreeningResult
  videoId1?: number
  videoId2?: number
  photos: string[]
  paymentTransactionId?: string
  paymentAmount?: number
  submittedAt?: string
  createdAt?: string
  updatedAt?: string
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  page: number
  size: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
}
