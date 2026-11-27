import Constants from 'expo-constants'
import { randomUUID } from 'expo-crypto'
import * as Notifications from 'expo-notifications'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { apiRequest } from '../../api/http'
import { getRuntimeLocale } from '../../i18n/runtime'

const INSTALLATION = 'android.push.installation'
const ENABLED_ACCOUNT = 'android.push.enabledAccount'
const CHANNEL = 'activity'
const PROJECT_ID = Constants.expoConfig?.extra?.eas?.projectId
export const androidPushAvailable = Platform.OS === 'android'
  && Constants.expoConfig?.extra?.androidPushConfigured === true && Boolean(PROJECT_ID)
let operations: Promise<unknown> = Promise.resolve()

function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const result = operations.then(operation, operation)
  operations = result.catch(() => undefined)
  return result
}

export async function pushEnabledFor(userId: string): Promise<boolean> {
  if (!androidPushAvailable) return false
  return (await SecureStore.getItemAsync(ENABLED_ACCOUNT)) === userId
    && (await Notifications.getPermissionsAsync()).granted
}

async function attach(): Promise<void> {
  let installation = await SecureStore.getItemAsync(INSTALLATION)
  if (!installation) {
    installation = randomUUID()
    await SecureStore.setItemAsync(INSTALLATION, installation)
  }
  const token = await Notifications.getExpoPushTokenAsync({ projectId: PROJECT_ID })
  await apiRequest(`/me/android-push/installations/${installation}`, {
    method: 'PUT', body: { token: token.data, locale: getRuntimeLocale() },
  })
}

export function enableAndroidPush(userId: string): Promise<boolean> {
  return serialize(async () => {
    if (!androidPushAvailable) return false
    await Notifications.setNotificationChannelAsync(CHANNEL, { name: 'GLOBAL AUDITION', importance: Notifications.AndroidImportance.DEFAULT })
    let permission = await Notifications.getPermissionsAsync()
    if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync()
    if (!permission.granted) return false
    await attach()
    await SecureStore.setItemAsync(ENABLED_ACCOUNT, userId)
    return true
  })
}

export function refreshAndroidPush(userId: string): Promise<void> {
  return serialize(async () => {
    if (!androidPushAvailable || await SecureStore.getItemAsync(ENABLED_ACCOUNT) !== userId) return
    if ((await Notifications.getPermissionsAsync()).granted) await attach()
    else await detach()
  })
}

async function detach() {
  const installation = await SecureStore.getItemAsync(INSTALLATION)
  if (installation) await apiRequest(`/me/android-push/installations/${installation}`, { method: 'DELETE' })
}

export function disableAndroidPush(): Promise<void> {
  return serialize(async () => {
    if (!androidPushAvailable) return
    try {
      await detach()
    } finally {
      await SecureStore.deleteItemAsync(ENABLED_ACCOUNT)
    }
  })
}
