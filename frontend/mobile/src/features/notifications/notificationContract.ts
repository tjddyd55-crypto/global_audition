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
}

export const NOTIFICATION_TYPE_COPY: Record<NotificationType, string> = {
  ROUND_OPEN: '라운드가 열리면 알려 드립니다.',
  PASS_NOTICE: '라운드 통과 안내',
  FAIL_NOTICE: '라운드 결과 안내',
  FINAL_NOTICE: '최종 결과 안내',
}

export const NOTIFICATION_API_MISSING = '알림 수신 API가 아직 공개되어 있지 않습니다. 결과는 내 지원서에서 확인할 수 있습니다.'
