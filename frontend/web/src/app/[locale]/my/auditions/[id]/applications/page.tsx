'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n.config'

/** 레거시 경로 — 지원자 관리 허브로 통합 */
export default function MyAuditionApplicationsLegacyRedirect() {
  const tCommon = useTranslations('common')
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (id) {
      router.replace(`/my/applicants?auditionId=${encodeURIComponent(id)}`)
    }
  }, [id, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-600">
      {tCommon('redirecting')}
    </div>
  )
}
