import { getRequestConfig } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from './i18n.config'

// 번역 파일 캐시 (메모리 캐싱)
const messageCache = new Map<string, any>()

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as any)) {
    notFound()
  }

  if (messageCache.has(locale)) {
    return {
      locale,
      messages: messageCache.get(locale),
      timeZone: 'Asia/Seoul',
    }
  }

  let messages
  try {
    messages = (await import(`../messages/${locale}.json`)).default
  } catch {
    messages = (await import(`../messages/${routing.defaultLocale}.json`)).default
  }
  messageCache.set(locale, messages)

  return {
    locale,
    messages,
    timeZone: 'Asia/Seoul',
  }
})
