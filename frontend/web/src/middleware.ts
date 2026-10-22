import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n.config'
import {
  redirectPathForAgencyConsole,
  redirectPathForRetiredLocale,
  redirectPathForSavedLocale,
  SAVED_LOCALE_COOKIE,
} from './shared/i18n/uiLocales'

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
  // next-intl rewrites /en/... onto itself with X-NEXT-INTL-LOCALE.
  // Next.js 14 runs middleware again on that rewrite and loops until the socket drops.
  const markedLocale = req.headers.get('x-next-intl-locale')
  const pathLocale = (req.nextUrl.pathname.split('/')[1] ?? '').toLowerCase()
  if (markedLocale && pathLocale === markedLocale.toLowerCase()) {
    const device = resolveDevice(req)
    const requestHeaders = new Headers(req.headers)
    requestHeaders.set(DEVICE_HEADER, device)
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    if (!req.cookies.get(DEVICE_COOKIE)) {
      res.cookies.set(DEVICE_COOKIE, device, {
        path: '/',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 180,
      })
    }
    return res
  }
  const retired = redirectPathForRetiredLocale(req.nextUrl.pathname)
  if (retired) {
    const url = req.nextUrl.clone()
    url.pathname = retired
    return NextResponse.redirect(url, 307)
  }

  const agency = redirectPathForAgencyConsole(req.nextUrl.pathname)
  if (agency) {
    const url = req.nextUrl.clone()
    url.pathname = agency
    return NextResponse.redirect(url, 307)
  }

  const saved = redirectPathForSavedLocale(
    req.nextUrl.pathname,
    req.cookies.get(SAVED_LOCALE_COOKIE)?.value,
  )
  if (saved) {
    const url = req.nextUrl.clone()
    url.pathname = saved
    return NextResponse.redirect(url, 307)
  }

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
  // 루트(/)는 저장 쿠키가 없으면 기본 언어(/en)로, 있으면 그 로케일로 리다이렉트됩니다
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
}
