import { useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import { Screen } from '../ui/Screen'
import { EmptyState } from '../ui/EmptyState'
import { useAuth } from './AuthProvider'

export function RequireAuth({ children, message }: { children: ReactNode; message?: string }) {
  const router = useRouter()
  const { ready, isAuthenticated } = useAuth()

  if (!ready) {
    return <Screen loading />
  }
  if (!isAuthenticated) {
    return (
      <Screen>
        <EmptyState
          title="로그인이 필요합니다"
          body={message ?? '이 화면은 로그인한 뒤 이용할 수 있습니다.'}
          actionLabel="로그인"
          onAction={() => router.push('/(auth)/login')}
        />
      </Screen>
    )
  }
  return <>{children}</>
}
