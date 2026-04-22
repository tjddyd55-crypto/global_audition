'use client'

import { useMemo } from 'react'
import { useMeProfile } from '@/shared/hooks/useMeProfile'
import { deriveSubscription } from './deriveSubscription'
import { canAccess } from './canAccess'
import { DEFAULT_SUBSCRIPTION, type FeatureKey, type SubscriptionState } from './types'

export type UseSubscriptionResult = {
  subscription: SubscriptionState
  isLoading: boolean
  can: (feature: FeatureKey) => boolean
}

/**
 * 현재 사용자의 구독 상태와 기능 접근 권한을 계산한다.
 *
 * - 호출자는 `useSubscription()` 한 줄로 상태와 `can('feature_key')`를 함께 얻는다.
 * - 비로그인/토큰 미보유 상태에서는 `FREE`로 폴백하므로 UI는 별도의 null 체크가 필요 없다.
 */
export function useSubscription(): UseSubscriptionResult {
  const { data, isLoading } = useMeProfile()

  const subscription = useMemo(
    () => (data ? deriveSubscription(data) : DEFAULT_SUBSCRIPTION),
    [data],
  )

  const can = useMemo(
    () => (feature: FeatureKey) => canAccess(subscription.plan, feature),
    [subscription.plan],
  )

  return { subscription, isLoading, can }
}
