import { notificationLink, type NotificationCopySource } from '../../../../web/src/shared/studio/notificationCopy'

export type NativeRoute = string | { pathname: '/web'; params: { path: string } }

/** 서버 알림 링크(웹 경로)를 네이티브 화면으로. 기획사 관리 화면은 웹 셸로 연다. */
export function nativeRouteForNotification(item: NotificationCopySource, lang = 'ko'): NativeRoute | null {
  const link = notificationLink(item)
  if (!link) return null
  let m = link.match(/^\/my\/studio\/casting\/([A-Za-z0-9-]+)$/)
  if (m) return `/casting/${m[1]}`
  if (link === '/my/studio/casting') return '/casting'
  m = link.match(/^\/channel\/([A-Za-z0-9-]+)$/)
  if (m) return `/channel/${m[1]}`
  m = link.match(/^\/auditions\/([A-Za-z0-9-]+)$/)
  if (m) return `/auditions/${m[1]}`
  if (link.startsWith('/my/casting') || link.startsWith('/my/talents')) return { pathname: '/web', params: { path: `/${lang}${link}` } }
  return null
}
