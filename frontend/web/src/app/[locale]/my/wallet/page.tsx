'use client'

import { useEffect } from 'react'
import { useRouter } from '@/i18n.config'

/**
 * 레거시 URL `/my/wallet` → 크레딧 SSOT `/credits` 로 통합.
 * 포인트(v1) 지갑 UI는 제거하여 이중 잔액/UX 혼란을 막는다.
 */
export default function WalletRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/credits')
  }, [router])

  return (
    <div className="container mx-auto px-4 py-8 text-center text-gray-600">
      크레딧 화면으로 이동합니다…
    </div>
  )
}
