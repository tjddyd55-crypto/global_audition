'use client'

import { useDevice, setDevicePref } from './DeviceContext'
import type { Device } from './constants'

type DeviceToggleProps = {
  className?: string
  /** 클릭 후 라우트 refresh 방식. 기본은 window.location.reload로 서버 분기가 다시 평가된다. */
  onToggled?: () => void
}

/**
 * 사용자 명시적 PC/모바일 전환 버튼.
 *
 * 왜 서버 재평가인가?
 * - device 분기는 서버가 `x-device` 헤더를 보고 `pc/pages`·`mobile/pages`를 고르기 때문에
 *   쿠키만 바꾸면 클라이언트 상태가 업데이트돼도 실제 페이지 컴포넌트는 그대로다.
 *   따라서 쿠키 갱신 후 reload로 서버가 다시 결정하게 한다.
 *
 * 어디에 배치?
 * - 헤더의 유저 드롭다운 맨 하단. 운영 초반에 UA 오감지가 발생해도 사용자가 직접 보정 가능.
 */
export function DeviceToggle({ className, onToggled }: DeviceToggleProps) {
  const current = useDevice()
  const next: Device = current === 'mobile' ? 'pc' : 'mobile'
  const label = current === 'mobile' ? 'PC 버전으로 보기' : '모바일 버전으로 보기'

  return (
    <button
      type="button"
      onClick={() => {
        setDevicePref(next)
        onToggled?.()
      }}
      className={className}
      aria-label={label}
    >
      {label}
    </button>
  )
}
