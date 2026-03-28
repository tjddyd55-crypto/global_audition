'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'sonner'
import { AuthSync } from '@/components/auth/AuthSync'

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient를 한 번만 생성하여 성능 최적화
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            /** 목록·상세가 서버와 바로 맞도록 기본은 즉시 stale (영상/채널은 키별로 덮어쓰기 가능) */
            staleTime: 0,
            gcTime: 10 * 60 * 1000,
            refetchOnWindowFocus: true,
            refetchOnMount: true,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <Toaster richColors position="top-center" />
      {children}
    </QueryClientProvider>
  )
}
