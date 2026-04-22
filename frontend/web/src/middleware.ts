import createIntlMiddleware from 'next-intl/middleware'
import type { NextRequest } from 'next/server'
import { routing } from './i18n.config'

/**
 * 디바이스 타입 쿠키/헤더 이름.
 *
 * 서버 컴포넌트(`headers().get(DEVICE_HEADER)`)와
 * 클라이언트 훅(`useDevice`)이 동일한 키로 참조한다.
 */
const DEVICE_HEADER = 'x-device'
const DEVICE_COOKIE = 'device_pref'

/**
 * 보수적인 모바일 UA 패턴.
 * 태블릿(iPad 등)은 PC 레이아웃을 기본으로 두기 위해 의도적으로 제외한다.
 */
const MOBILE_UA = /iPhone|iPod|Android.+Mobile|Mobile Safari|Opera Mini|IEMobile|BlackBerry/i

type Device = 'pc' | 'mobile'

function resolveDevice(req: NextRequest): Device {
  const pref = req.cookies.get(DEVICE_COOKIE)?.value
  if (pref === 'pc' || pref === 'mobile') return pref
  const ua = req.headers.get('user-agent') ?? ''
  return MOBILE_UA.test(ua) ? 'mobile' : 'pc'
}

const intlMiddleware = createIntlMiddleware(routing)

export default function middleware(req: NextRequest) {
  const res = intlMiddleware(req)
  const device = resolveDevice(req)

  res.headers.set(DEVICE_HEADER, device)

  if (!req.cookies.get(DEVICE_COOKIE)) {
    res.cookies.set(DEVICE_COOKIE, device, {
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 180, // 180d
    })
  }

  return res
}

export const config = {
  // 모든 경로에서 미들웨어 실행 (정적 파일 제외)
  // `/admin/*`는 로케일 접두 없이 동작 (슈퍼관리자 콘솔)
  // 루트 경로(/)도 자동으로 기본 언어(/ko)로 리다이렉트됩니다
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
}
