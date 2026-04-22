import { DEFAULT_SUBSCRIPTION, type Plan, type SubscriptionState } from './types'

/**
 * 백엔드 프로필 응답을 프론트 도메인 상태로 환산한다.
 *
 * 현재 스펙이 없으므로 기본값을 반환하지만, 호출 지점을 미리 확정해두면
 * 추후 `plan`, `trialEndsAt`, `paidUntil` 필드가 추가될 때 본 함수 한 곳만 수정하면 된다.
 */
export function deriveSubscription(profile: unknown): SubscriptionState {
  if (!profile || typeof profile !== 'object') return DEFAULT_SUBSCRIPTION

  const p = profile as Record<string, unknown>
  const plan = normalizePlan(p.plan)
  const trialEndsAt = typeof p.trialEndsAt === 'string' ? p.trialEndsAt : null
  const paidUntil = typeof p.paidUntil === 'string' ? p.paidUntil : null

  return { plan, trialEndsAt, paidUntil }
}

function normalizePlan(value: unknown): Plan {
  if (value === 'TRIAL' || value === 'PAID' || value === 'EXPIRED') return value
  return 'FREE'
}
