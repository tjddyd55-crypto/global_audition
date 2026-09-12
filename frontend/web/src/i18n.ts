import { getRequestConfig } from 'next-intl/server'
import type { AbstractIntlMessages } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from './i18n.config'
import { deepMergeMessages } from './shared/i18n/mergeMessages'

const messageCache = new Map<string, AbstractIntlMessages>()

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

  const english = (await import('../messages/en.json')).default as AbstractIntlMessages
  let override: AbstractIntlMessages
  try {
    override = (await import(`../messages/${locale}.json`)).default as AbstractIntlMessages
  } catch {
    override = (await import(`../messages/${routing.defaultLocale}.json`)).default as AbstractIntlMessages
  }
  const messages = (locale === 'en'
    ? english
    : deepMergeMessages(english as Record<string, unknown>, override as Record<string, unknown>)) as AbstractIntlMessages
  messageCache.set(locale, messages)

  return {
    locale,
    messages,
    timeZone: 'Asia/Seoul',
  }
})
