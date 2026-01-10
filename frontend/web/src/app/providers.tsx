'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient를 한 번만 생성하여 성능 최적화
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5분으로 증가 (더 적은 리패치)
            gcTime: 10 * 60 * 1000, // 가비지 컬렉션 시간 10분 (v5에서 cacheTime -> gcTime으로 변경됨)
            refetchOnWindowFocus: false,
            refetchOnMount: false, // 마운트 시 리패치 비활성화
            retry: 1, // 재시도 횟수 감소
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
