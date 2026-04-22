'use client'

import { useQuery } from '@tanstack/react-query'
import { meProfileApi } from '@/shared/api/meProfile'
import { authApi } from '@/shared/api/auth'

/**
 * 로그인 사용자의 프로필을 React Query로 감싼 훅.
 *
 * - 토큰이 없으면 쿼리가 비활성화되어 네트워크 요청도 발생하지 않는다.
 * - staleTime 60초로 페이지 내 중복 렌더의 과잉 호출을 방지.
 *
 * 훅을 별도 레이어에 두는 이유:
 * PC/모바일 UI 및 `useSubscription`이 같은 쿼리 키와 캐시를 공유해야 하기 때문이다.
 * UI 컴포넌트가 React Query 세부를 직접 다루지 않도록 추상화한다.
 */
export function useMeProfile() {
  const hasToken = typeof window !== 'undefined' && !!authApi.getToken()
  return useQuery({
    queryKey: ['me-profile'],
    queryFn: () => meProfileApi.get(),
    enabled: hasToken,
    staleTime: 60_000,
  })
}
