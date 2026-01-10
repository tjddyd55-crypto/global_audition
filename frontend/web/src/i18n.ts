import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from './i18n.config'

// 번역 파일 캐시 (메모리 캐싱)
const messageCache = new Map<string, any>()

export default getRequestConfig(async ({ locale }) => {
  // 지원하지 않는 언어인 경우 404
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // 캐시에서 먼저 확인
  if (messageCache.has(locale)) {
    return {
      messages: messageCache.get(locale),
    }
  }

  // 번역 파일 동적 로드
  let messages
  try {
    messages = (await import(`../messages/${locale}.json`)).default
  } catch (error) {
    // 번역 파일이 없는 경우 기본 언어로 폴백
    messages = (await import(`../messages/${routing.defaultLocale}.json`)).default
  }
  
  // 캐시에 저장
  messageCache.set(locale, messages)

  return {
    messages,
    // 시간대 설정으로 성능 개선
    timeZone: 'Asia/Seoul',
  }
})
