'use client'

import { useEffect } from 'react'
import { useRouter } from '../../../../i18n.config'

/** 레거시 경로 → SSOT: /dashboard/auditions/create */
export default function AuditionCreateRedirectPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/auditions/create')
  }, [router])
  return (
    <div style={{ minHeight: '30vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      이동 중…
    </div>
  )
}
