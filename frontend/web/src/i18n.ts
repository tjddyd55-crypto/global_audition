import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'

// 지원하는 언어 목록
export const locales = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de'] as const
export type Locale = (typeof locales)[number]

// 번역 파일 캐시 (메모리 캐싱)
const messageCache = new Map<string, any>()

export default getRequestConfig(async ({ locale }) => {
  // 지원하지 않는 언어인 경우 404
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // 캐시에서 먼저 확인
  if (messageCache.has(locale)) {
    return {
      messages: messageCache.get(locale),
    }
  }

  // 번역 파일 동적 로드
  const messages = (await import(`../messages/${locale}.json`)).default
  
  // 캐시에 저장
  messageCache.set(locale, messages)

  return {
    messages,
    // 시간대 설정으로 성능 개선
    timeZone: 'Asia/Seoul',
  }
})
