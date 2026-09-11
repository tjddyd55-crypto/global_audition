import { getLocales } from 'expo-localization'
import * as SecureStore from 'expo-secure-store'
import { ReactNode, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './index'
import { detectDeviceLocale, PRIMARY_LOCALES, setRuntimeLocale } from './runtime'

const STORAGE_KEY = 'app.locale'

type Props = { children: ReactNode }

export function LocaleProvider({ children }: Props) {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY)
      const device = detectDeviceLocale(getLocales()[0]?.languageCode)
      const next = stored && PRIMARY_LOCALES.includes(stored) ? stored : device
      if (cancelled) return
      setRuntimeLocale(next)
      await i18n.changeLanguage(next)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}

export async function persistLocale(locale: string) {
  const next = PRIMARY_LOCALES.includes(locale) ? locale : detectDeviceLocale(locale)
  setRuntimeLocale(next)
  await SecureStore.setItemAsync(STORAGE_KEY, next)
  await i18n.changeLanguage(next)
}
