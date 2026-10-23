/**
 * 수신함은 GET /api/me/notifications 이다.
 * audition_round_notifications 의 IN_APP 행만 읽고, 빈 목록은 알림이 없는 상태다.
 * 가짜 FCM 토큰이나 종류 설명 카드를 성공처럼 보여 주지 않는다.
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
