/**
 * 백엔드는 RoundNotificationService가 ROUND_OPEN/PASS_NOTICE/FAIL_NOTICE/FINAL_NOTICE 를
 * audition_round_notifications 테이블에만 기록한다. 공개 GET API는 없다.
 * 네이티브는 인터페이스와 빈 상태만 두고, 가짜 FCM 토큰/자격증명을 만들지 않는다.
 */
import type { NotificationDeliveryStatus, NotificationType } from '../../api/types'

export type NotificationInboxItem = {
  id: string
  type: NotificationType
  status: NotificationDeliveryStatus
  title: string
  body: string
  createdAt: string
  /** 지원서 상세 등 기존 라우팅 semantics */
  applicationId?: string | null
  auditionId?: string | null
}

/** 알림 타입별 i18n 키 (렌더 시 t() 사용) */
export const NOTIFICATION_TYPE_I18N: Record<NotificationType, string> = {
  ROUND_OPEN: 'notifications.ROUND_OPEN',
  PASS_NOTICE: 'notifications.PASS_NOTICE',
  FAIL_NOTICE: 'notifications.FAIL_NOTICE',
  FINAL_NOTICE: 'notifications.FINAL_NOTICE',
}

export function notificationDeepLinkPath(item: NotificationInboxItem): string | null {
  if (item.applicationId) return `/applications/${item.applicationId}`
  if (item.auditionId) return `/auditions/${item.auditionId}`
  return null
}
