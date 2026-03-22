'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { useRouter } from '@/i18n.config'

/** 레거시 URL — /vote 로 통일 */
export default function AuditionVotesLegacyRedirectPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  useEffect(() => {
    if (id) router.replace(`/auditions/${id}/vote`)
  }, [id, router])

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-gray-600">
      이동 중…
    </div>
  )
}
