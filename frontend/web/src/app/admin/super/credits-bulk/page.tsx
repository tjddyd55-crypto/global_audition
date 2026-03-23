'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/** @deprecated `/admin/super/bulk-grant` 로 통합 */
export default function SuperAdminCreditsBulkLegacyRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/super/bulk-grant')
  }, [router])
  return (
    <div className="p-6 text-center text-sm text-gray-600">대량 지급 페이지로 이동 중…</div>
  )
}
