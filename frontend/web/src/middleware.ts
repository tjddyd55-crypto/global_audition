import createMiddleware from 'next-intl/middleware'
import { routing } from './i18n.config'

export default createMiddleware(routing)

export const config = {
  // 모든 경로에서 미들웨어 실행 (정적 파일 제외)
  // `/admin/*`는 로케일 접두 없이 동작 (슈퍼관리자 콘솔)
  // 루트 경로(/)도 자동으로 기본 언어(/ko)로 리다이렉트됩니다
  matcher: ['/((?!api|_next|_vercel|admin|.*\\..*).*)'],
}
