import { useRouter } from 'expo-router'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Screen } from '../ui/Screen'
import { EmptyState } from '../ui/EmptyState'
import { useAuth } from './AuthProvider'

export function RequireAuth({ children, message }: { children: ReactNode; message?: string }) {
  const { t } = useTranslation()
  const router = useRouter()
  const { ready, isAuthenticated } = useAuth()

  if (!ready) {
    return <Screen loading />
  }
  if (!isAuthenticated) {
    return (
      <Screen>
        <EmptyState
          title={t('myApplications.loginTitle')}
          body={message ?? t('auth.loginRequiredBody')}
          actionLabel={t('common.login')}
          onAction={() => router.push('/(auth)/login')}
        />
      </Screen>
    )
  }
  return <>{children}</>
}
