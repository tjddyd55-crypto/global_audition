import type { FeatureKey, Plan } from './types'

/**
 * 기능별 최소 요구 플랜 매핑.
 *
 * 새 기능을 추가할 때는 여기에만 항목을 추가하면 되고,
 * UI 코드는 `canAccess(plan, featureKey)`만 호출한다.
 */
const FEATURE_MIN_PLAN: Record<FeatureKey, Plan[]> = {
  premium_audition_apply: ['TRIAL', 'PAID'],
  agency_advanced_analytics: ['PAID'],
  video_hd_upload: ['TRIAL', 'PAID'],
}

export function canAccess(plan: Plan, feature: FeatureKey): boolean {
  const allowed = FEATURE_MIN_PLAN[feature]
  if (!allowed) return false
  return allowed.includes(plan)
}
