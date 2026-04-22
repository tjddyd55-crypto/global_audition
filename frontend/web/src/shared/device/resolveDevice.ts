import { headers } from 'next/headers'
import { DEVICE_HEADER, type Device } from './constants'

/**
 * 서버 컴포넌트에서 현재 요청의 디바이스 타입을 읽는다.
 *
 * 미들웨어가 `x-device` 헤더를 주입하므로, 미들웨어 matcher에 포함되는 경로에서만 유효하다.
 * 그 외(API route 등)에서는 기본값 `pc`로 폴백한다.
 */
export function getDeviceFromHeaders(): Device {
  const value = headers().get(DEVICE_HEADER)
  return value === 'mobile' ? 'mobile' : 'pc'
}
