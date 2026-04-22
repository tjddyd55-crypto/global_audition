/**
 * 사용자 구독 상태 도메인 타입.
 *
 * 현재 백엔드(`MeProfile`)에는 구독 관련 필드가 존재하지 않는다.
 * 본 모듈은 프론트엔드에서 UI 레벨 의사결정을 추상화하는 "셸"로 먼저 자리 잡고,
 * 백엔드 스펙이 확정되면 `deriveSubscription`에서만 매핑을 추가하면 된다.
 *
 * 상태 전이:
 *   FREE → TRIAL (트라이얼 시작)
 *   TRIAL → PAID (유료 전환)
 *   PAID → EXPIRED (결제 실패·만료)
 *   * → FREE (취소/환불)
 */
export type Plan = 'FREE' | 'TRIAL' | 'PAID' | 'EXPIRED'

export type SubscriptionState = {
  plan: Plan
  /** TRIAL 종료 일시(ISO). 해당 상태가 아닌 경우 null. */
  trialEndsAt: string | null
  /** 유료 만료 일시(ISO). 해당 상태가 아닌 경우 null. */
  paidUntil: string | null
}

/**
 * 기능 키는 컴포넌트가 권한을 문의할 때 쓰는 좁은 도메인 어휘.
 * 실제 게이트 기준은 `canAccess`가 결정한다.
 */
export type FeatureKey =
  | 'premium_audition_apply'
  | 'agency_advanced_analytics'
  | 'video_hd_upload'

export const DEFAULT_SUBSCRIPTION: SubscriptionState = {
  plan: 'FREE',
  trialEndsAt: null,
  paidUntil: null,
}
