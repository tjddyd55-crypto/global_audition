/**
 * `/admin` 문서 요청의 역할 판정. 세션 확인은 미들웨어가 서버에서 한다.
 * GLOBAL_SUPER_ADMIN 은 본사 SUPER_ADMIN 과 같은 옛 별칭이고, 새 역할이 아니다.
 */

const HEADQUARTERS = new Set(['SUPER_ADMIN', 'GLOBAL_SUPER_ADMIN'])
const COUNTRY = new Set(['COUNTRY_ADMIN', 'COUNTRY_STAFF'])

/** 국가 직원 메뉴에 없고, 직접 URL 도 막는다. */
const STAFF_DENIED = [
  '/admin/country/approvals',
  '/admin/country/staff',
  '/admin/country/settlement',
  '/admin/country/contract',
]

const AGENCY_DETAIL = /^\/admin\/country\/agencies\/([0-9a-fA-F-]{36})$/

export function isAdminPagePath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export function adminPageAllowed(pathname: string, role: string | null | undefined): boolean {
  if (!isAdminPagePath(pathname)) return true
  if (!role) return false
  if (pathname === '/admin/super' || pathname.startsWith('/admin/super/')) {
    return HEADQUARTERS.has(role)
  }
  if (pathname === '/admin/country' || pathname.startsWith('/admin/country/')) {
    if (!COUNTRY.has(role)) return false
    if (role === 'COUNTRY_STAFF' && STAFF_DENIED.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return false
    }
    return true
  }
  return false
}

/** 기획사 상세만. 목록 `/admin/country/agencies` 는 null. */
export function countryAgencyDetailId(pathname: string): string | null {
  return AGENCY_DETAIL.exec(pathname)?.[1] ?? null
}
