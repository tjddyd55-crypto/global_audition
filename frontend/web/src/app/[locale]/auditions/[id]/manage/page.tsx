'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n.config'
import { useAuthStore } from '@/shared/auth/authStore'

/** 공개 URL — 기획사 허브의 상태·지원자 관리로 이동 */
export default function AuditionManageRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const role = useAuthStore((s) => s.role)
  const [ready, setReady] = useState(false)
  const auditionId = params.id as string

  useEffect(() => {
    useAuthStore.getState().syncFromStorage()
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready || !auditionId) return
    if (role === 'AGENCY' || role === 'ADMIN') {
      router.replace(`/my/auditions/${auditionId}/manage`)
    } else {
      router.replace(`/auditions/${auditionId}`)
    }
  }, [auditionId, ready, role, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-600">
      이동 중…
    </div>
  )
}
