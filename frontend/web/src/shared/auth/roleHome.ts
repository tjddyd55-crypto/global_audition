/**
 * 기존 로그인 분기. 역할별 첫 화면만 고르고, 인증 저장 방식은 바꾸지 않는다.
 * 본사 최고 관리자 역할은 SUPER_ADMIN 이다. GLOBAL_SUPER_ADMIN 은 옛 토큰 별칭이다.
 */
export function pathAfterLogin(role: string | null | undefined): string {
  if (role === 'SUPER_ADMIN' || role === 'GLOBAL_SUPER_ADMIN') return '/admin/super'
  if (role === 'COUNTRY_ADMIN' || role === 'COUNTRY_STAFF') return '/admin/country'
  if (role === 'BUSINESS' || role === 'AGENCY' || role === 'AGENCY_ADMIN' || role === 'ADMIN') return '/my/dashboard'
  if (role === 'APPLICANT') return '/my/studio'
  return '/'
}

export function isAdminConsolePath(path: string): boolean {
  return path === '/admin' || path.startsWith('/admin/')
}
