'use client'

import { useEffect } from 'react'

/**
 * 서비스 워커 등록 훅 (모바일 전용).
 *
 * - 프로덕션 빌드에서만 등록하여 개발 중 캐시로 인한 혼선을 방지한다.
 * - HTTPS/localhost 외 컨텍스트에서는 브라우저가 차단하므로 등록 실패를 무시한다.
 * - 등록 지점을 한 곳에 모아두면 추후 업데이트 알림/강제 새로고침 UX를 덧붙이기 쉽다.
 */
export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const controller = new AbortController()
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
        // 등록 실패는 치명적이지 않으므로 UX를 차단하지 않는다.
      })
    }
    window.addEventListener('load', onLoad, { signal: controller.signal })
    return () => controller.abort()
  }, [])
}
