import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse, type NextRequest } from 'next/server'
import { routing } from './i18n.config'
import { adminPageAllowed, countryAgencyDetailId, isAdminPagePath } from './shared/auth/adminPageAccess'
import {
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

function redirectOnRequestOrigin(req: NextRequest, pathname: string) {
  const url = req.nextUrl.clone()
  url.pathname = pathname
  return NextResponse.redirect(url, 307)
}

function backendOrigin(): string {
  return (process.env.BACKEND_PROXY_ORIGIN || 'http://127.0.0.1:8081').trim().replace(/\/+$/, '')
}

function forbiddenPage() {
  const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>403</title></head><body><h1>403</h1><p>이 관리 화면에 접근할 권한이 없습니다.</p></body></html>`
  return new NextResponse(html, {
    status: 403,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

function sessionHeaders(req: NextRequest): Headers | null {
  const headers = new Headers({ accept: 'application/json' })
  const cookie = req.cookies.get('accessToken')?.value
  const authorization = req.headers.get('authorization')
  if (cookie) headers.set('cookie', `accessToken=${cookie}`)
  else if (authorization?.toLowerCase().startsWith('bearer ')) headers.set('authorization', authorization)
  else return null
  return headers
}

async function sessionRole(req: NextRequest): Promise<string | null> {
  const headers = sessionHeaders(req)
  if (!headers) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(`${backendOrigin()}/api/auth/me`, {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) return null
    const body = (await res.json()) as { data?: { role?: string }; role?: string }
    const role = body.data?.role ?? body.role
    return typeof role === 'string' && role.length > 0 ? role : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

async function agencyVisible(req: NextRequest, agencyId: string): Promise<boolean> {
  const headers = sessionHeaders(req)
  if (!headers) return false
  const origin = backendOrigin()
  const countriesRes = await fetch(`${origin}/api/admin/org/countries`, { headers, cache: 'no-store' })
  if (!countriesRes.ok) return false
  const countries = (await countriesRes.json()) as Array<{ code?: string }>
  const code = countries[0]?.code
  if (!code) return false
  const listRes = await fetch(`${origin}/api/admin/org/crm/agencies?country=${encodeURIComponent(code)}`, {
    headers,
    cache: 'no-store',
  })
  if (!listRes.ok) return false
  const rows = (await listRes.json()) as Array<{ id?: string }>
  return rows.some((row) => row.id === agencyId)
}

async function guardAdminPage(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const role = await sessionRole(req)
  if (!adminPageAllowed(pathname, role)) return forbiddenPage()
  const agencyId = countryAgencyDetailId(pathname)
  if (agencyId && !(await agencyVisible(req, agencyId))) return forbiddenPage()
  return NextResponse.next()
}

export default async function middleware(req: NextRequest) {
  if (isAdminPagePath(req.nextUrl.pathname)) {
    return guardAdminPage(req)
  }
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
  if (retired) return redirectOnRequestOrigin(req, retired)

  const saved = redirectPathForSavedLocale(
    req.nextUrl.pathname,
    req.cookies.get(SAVED_LOCALE_COOKIE)?.value,
  )
  if (saved) return redirectOnRequestOrigin(req, saved)

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
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
