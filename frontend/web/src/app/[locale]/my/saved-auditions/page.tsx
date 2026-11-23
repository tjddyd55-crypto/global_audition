'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n.config'
import { authApi } from '@/shared/api/auth'
import { useAuthStore } from '@/shared/auth/authStore'
import SavedAuditionList from '@/components/saves/SavedAuditionList'
import { PAGE_CONTAINER, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function SavedAuditionsPage() {
  const t = useTranslations('savedAuditions')
  const router = useRouter()
  const accessToken = useAuthStore((s) => s.accessToken)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!accessToken && !authApi.getToken()) {
      router.push('/login')
    }
  }, [accessToken, hydrated, router])

  return (
    <div className={`${PAGE_CONTAINER} py-8`}>
      <h1 className={TITLE_PAGE}>{t('title')}</h1>
      <div className="mt-6">
        <SavedAuditionList />
      </div>
    </div>
  )
}
