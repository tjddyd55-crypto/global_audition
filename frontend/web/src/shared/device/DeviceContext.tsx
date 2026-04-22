'use client'

import { createContext, useContext, useMemo } from 'react'
import { DEVICE_COOKIE, type Device } from './constants'

/**
 * 서버에서 결정된 device를 단일 출처(SSOT)로 삼는 Context.
 *
 * 초기 렌더 시 SSR-클라이언트 간 불일치를 막기 위해
 * 값은 `RootLayout`에서 `<DeviceProvider value={device}>`로 주입한다.
 * 이후 사용자의 수동 전환(토글)은 쿠키를 갱신하고 `router.refresh()`로 재렌더하면
 * 자연스럽게 새 값이 전파된다.
 */
const DeviceContext = createContext<Device | null>(null)

export function DeviceProvider({
  value,
  children,
}: {
  value: Device
  children: React.ReactNode
}) {
  return <DeviceContext.Provider value={value}>{children}</DeviceContext.Provider>
}

/**
 * 현재 device("pc"|"mobile")를 반환.
 *
 * @throws Provider 하위가 아닌 곳에서 호출하면 에러. UI 컴포넌트는 항상 RootLayout 하위에서 실행되므로
 *         개발 중 이 에러가 뜨면 Provider 누락이거나 shared/* 경계 밖에서 호출한 것이다.
 */
export function useDevice(): Device {
  const ctx = useContext(DeviceContext)
  if (ctx == null) {
    throw new Error('useDevice must be used inside <DeviceProvider>')
  }
  return ctx
}

export type DeviceToggleOptions = {
  /** 토글 직후 `router.refresh()`를 호출할지 여부. 기본 true. */
  refresh?: boolean
}

/**
 * 사용자 명시적 전환용 토글.
 * 쿠키를 갱신한 뒤, 기본적으로 전체 라우트 세그먼트를 재-렌더(refresh)해서
 * 서버가 새로운 device로 컴포넌트를 선택하게 한다.
 */
export function setDevicePref(next: Device, options: DeviceToggleOptions = {}) {
  if (typeof document === 'undefined') return
  const maxAge = 60 * 60 * 24 * 180
  document.cookie = `${DEVICE_COOKIE}=${next}; Path=/; Max-Age=${maxAge}; SameSite=Lax`
  if (options.refresh !== false) {
    // next/navigation router.refresh는 컴포넌트 컨텍스트 외부에서 호출할 수 없으므로
    // 단순 location.reload로 폴백. 컴포넌트 레벨에서는 useRouter().refresh()를 선호.
    window.location.reload()
  }
}

/**
 * 모바일 프리픽스(`/m`)나 URL 단위 분기가 필요할 때 사용할 수 있는 도우미.
 * 현재 구조는 URL을 단일 유지하므로 라우트 분기에는 쓰지 않고, UI 전용 세부 분기용 훅이다.
 */
export function useIsMobile(): boolean {
  return useContext(DeviceContext) === 'mobile'
}

// 메모 전용 export — 향후 확장(화면 크기 런타임 감시 등)에서 재사용
export function useDeviceMemo<T>(factory: (device: Device) => T, deviceOverride?: Device): T {
  // React Hook 규칙 상 조건부 호출이 불가하므로 항상 useDevice()를 먼저 호출하고
  // override가 주어진 경우에만 그 값을 우선한다.
  const ctxDevice = useDevice()
  const device = deviceOverride ?? ctxDevice
  return useMemo(() => factory(device), [device, factory])
}
