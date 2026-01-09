/**
 * 공통 TypeScript 타입 정의
 * 프론트엔드와 모바일 앱에서 공유
 */

// 사용자 타입
export enum UserType {
  APPLICANT = 'APPLICANT',      // 지망생
  BUSINESS = 'BUSINESS'         // 기획사
}

// 오디션 상태
export enum AuditionStatus {
  ONGOING = 'ONGOING',           // 진행중
  UNDER_SCREENING = 'UNDER_SCREENING', // 심사중
  FINISHED = 'FINISHED',         // 종료
  WAITING_OPENING = 'WAITING_OPENING', // 오픈 대기
  WRITING = 'WRITING'            // 작성중
}

// 심사 단계
export enum ScreeningRound {
  FIRST = 'FIRST',               // 1차
  SECOND = 'SECOND',             // 2차
  THIRD = 'THIRD',               // 3차
  FINAL = 'FINAL'                // 최종
}

// 지원 상태
export enum ApplicationStatus {
  WRITING = 'WRITING',
  INCOMPLETE_PAYMENT = 'INCOMPLETE_PAYMENT',
  APPLICATION_COMPLETED = 'APPLICATION_COMPLETED',
  CANCEL = 'CANCEL'
}

// 심사 결과
export enum ScreeningResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  PENDING = 'PENDING'
}

// 오디션 분야
export enum AuditionCategory {
  SINGER = 'SINGER',             // 가수
  DANCER = 'DANCER',             // 댄서
  ACTOR = 'ACTOR',               // 연기
  MODEL = 'MODEL',               // 모델
  INSTRUMENT = 'INSTRUMENT'      // 악기
}

// 오디션 제안 상태
export enum OfferStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

// 공통 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 페이지네이션
export interface PageRequest {
  page: number;
  size: number;
  sort?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// 사용자 정보
export interface User {
  id: number;
  email: string;
  name: string;
  type: UserType;
  profileImage?: string;
  createdAt: string;
}

// 오디션 정보
export interface Audition {
  id: number;
  title: string;
  titleEn: string;
  category: AuditionCategory;
  status: AuditionStatus;
  description: string;
  requirements: string;
  startDate: string;
  endDate: string;
  screeningDate1?: string;
  screeningDate2?: string;
  screeningDate3?: string;
  announcementDate1?: string;
  announcementDate2?: string;
  announcementDate3?: string;
  businessId: number;
  businessName: string;
  createdAt: string;
}

// 오디션 지원 정보
export interface Application {
  id: number;
  auditionId: number;
  userId: number;
  status: ApplicationStatus;
  result1?: ScreeningResult;
  result2?: ScreeningResult;
  result3?: ScreeningResult;
  finalResult?: ScreeningResult;
  videoId1?: number;
  videoId2?: number;
  photos: string[];
  submittedAt: string;
}

// 오디션 제안
export interface AuditionOffer {
  id: number;
  auditionId: number;
  businessId: number;
  userId: number;
  videoContentId: number;
  message?: string;
  status: OfferStatus;
  createdAt: string;
  readAt?: string;
  respondedAt?: string;
}

// 비디오 콘텐츠
export interface VideoContent {
  id: number;
  userId: number;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration?: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  category?: AuditionCategory;
  createdAt: string;
}
