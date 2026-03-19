/** UI 톤 통일용 fallback 텍스트 */
export const FALLBACK_TEXT = {
  userName: '이름 없음',
  videoTitle: '제목 없음',
  channelName: '채널 없음',
  description: '설명 없음',
  date: '날짜 없음',
} as const

/** 기본 이미지 경로 (public). .svg 사용 시 Next Image unoptimized 권장 */
export const DEFAULT_IMAGES = {
  avatar: '/avatar-default.svg',
  videoThumbnail: '/video-placeholder.svg',
} as const
