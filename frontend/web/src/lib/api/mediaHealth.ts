import { API_BASE_URL } from '@/lib/env'

/**
 * Media-Service Health-check 전용 API (GET only)
 *
 * 사용 규칙:
 * - 자동 실행 금지 (앱 초기화/전역에서 호출 금지)
 * - 테스트 페이지 또는 관리자 영역에서만 호출
 * - 실제 데이터 변경/업로드 없음
 */
export async function checkMediaHealth(): Promise<{ status: string; [k: string]: unknown }> {
  const res = await fetch(`${API_BASE_URL}/api/v1/videos?page=0&size=1`, { cache: 'no-store' })
  if (!res.ok) throw new Error('Media service unavailable')
  return res.json()
}
