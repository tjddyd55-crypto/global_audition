/**
 * Bearer 토큰 저장소 — apiClient 인터셉터와 apiFetch가 동일 키를 사용해야 403/401이 줄어든다.
 */
export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return (
    localStorage.getItem('accessToken') ||
    localStorage.getItem('auth_token') ||
    localStorage.getItem('token')
  )
}
