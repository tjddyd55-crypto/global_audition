/**
 * device 레이어의 런타임 상수.
 *
 * 미들웨어, 서버 컴포넌트, 클라이언트 훅이 모두 동일한 키로 접근해야 하므로
 * 단일 소스에서 정의한다.
 */

export const DEVICE_HEADER = 'x-device'
export const DEVICE_COOKIE = 'device_pref'

export type Device = 'pc' | 'mobile'
