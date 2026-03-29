'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n.config'
import { useAuthStore } from '@/lib/auth/authStore'

export default function AuditionRoundReviewRedirectPage() {
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
      router.replace(`/my/auditions/${auditionId}/round-review`)
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
