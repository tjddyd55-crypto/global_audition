import { useEffect } from 'react'
import { AppState } from 'react-native'
import { useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../auth/AuthProvider'
import { androidPushAvailable, pushEnabledFor, refreshAndroidPush } from './androidPush'
import { pushDestination } from './pushDestination'

export function AndroidPushListener() {
  const { ready, session } = useAuth()
  const router = useRouter()
  const { i18n } = useTranslation()
  const userId = session?.userId

  useEffect(() => {
    if (!androidPushAvailable || !ready || !userId) return
    const refresh = () => { void refreshAndroidPush(userId).catch(() => undefined) }
    refresh()
    const active = AppState.addEventListener('change', state => { if (state === 'active') refresh() })
    const token = Notifications.addPushTokenListener(refresh)
    return () => { active.remove(); token.remove() }
  }, [ready, userId, i18n.language])

  useEffect(() => {
    if (!androidPushAvailable || !ready || !userId) return
    let active = true
    Notifications.setNotificationHandler({
      handleNotification: async notification => {
        const data = notification.request.content.data
        const show = data.recipient === userId && Boolean(pushDestination(data.link))
          && await pushEnabledFor(userId).catch(() => false) && active
        return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: false, shouldSetBadge: false }
      },
    })
    return () => {
      active = false
      Notifications.setNotificationHandler(null)
    }
  }, [ready, userId])

  useEffect(() => {
    if (!androidPushAvailable || !ready) return
    const open = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data
      Notifications.clearLastNotificationResponse()
      if (response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return
      const path = pushDestination(data.link)
      if (!path || typeof data.recipient !== 'string' || (userId && data.recipient !== userId)) return
      router.push((userId ? path : `/login?next=${encodeURIComponent(path)}`) as never)
    }
    const saved = Notifications.getLastNotificationResponse()
    if (saved) open(saved)
    const listener = Notifications.addNotificationResponseReceivedListener(open)
    return () => listener.remove()
  }, [ready, router, userId])

  return null
}
