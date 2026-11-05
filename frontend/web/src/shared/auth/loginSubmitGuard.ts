import { useEffect, useRef, useState } from 'react'

/**
 * 로그인 폼 제출 가드.
 * - SSR HTML 단계(하이드레이션 전)에는 hydrated=false → 버튼 disabled.
 *   하이드레이션 전에 누르면 React 핸들러 없이 브라우저 기본 GET 제출이 일어나
 *   `/login?email=..&password=..` 로 새로고침되고 로그인 API 가 호출되지 않던 문제 방지.
 * - tryBegin(): 동시 더블 제출 차단 (리렌더 전 ref 기준).
 */
export function useLoginSubmitGuard() {
  const [hydrated, setHydrated] = useState(false)
  const inFlight = useRef(false)
  useEffect(() => setHydrated(true), [])
  return {
    hydrated,
    tryBegin: () => {
      if (inFlight.current) return false
      inFlight.current = true
      return true
    },
    end: () => {
      inFlight.current = false
    },
  }
}
