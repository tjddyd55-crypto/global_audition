import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'ga.accessToken'
const ROLE_KEY = 'ga.userRole'
const USER_KEY = 'ga.userId'
const EMAIL_KEY = 'ga.email'
const NICK_KEY = 'ga.nickname'

export type StoredSession = {
  token: string
  role: string
  userId: string
  email?: string
  nickname?: string
}

export async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function readSession(): Promise<StoredSession | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY)
  if (!token) return null
  return {
    token,
    role: (await SecureStore.getItemAsync(ROLE_KEY)) ?? '',
    userId: (await SecureStore.getItemAsync(USER_KEY)) ?? '',
    email: (await SecureStore.getItemAsync(EMAIL_KEY)) ?? undefined,
    nickname: (await SecureStore.getItemAsync(NICK_KEY)) ?? undefined,
  }
}

export async function writeSession(session: StoredSession): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, session.token)
  await SecureStore.setItemAsync(ROLE_KEY, session.role)
  await SecureStore.setItemAsync(USER_KEY, session.userId)
  await SecureStore.setItemAsync(EMAIL_KEY, session.email ?? '')
  await SecureStore.setItemAsync(NICK_KEY, session.nickname ?? '')
}

export async function clearSession(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync(ROLE_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
    SecureStore.deleteItemAsync(EMAIL_KEY),
    SecureStore.deleteItemAsync(NICK_KEY),
  ])
}
