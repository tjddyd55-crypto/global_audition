import * as SecureStore from 'expo-secure-store'
import { ReactNode, useEffect } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n from './index'
import { DEFAULT_LOCALE, PRIMARY_LOCALES, resolveInitialLocale, setRuntimeLocale } from './runtime'

const STORAGE_KEY = 'app.locale'

type Props = { children: ReactNode }

export function LocaleProvider({ children }: Props) {
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const stored = await SecureStore.getItemAsync(STORAGE_KEY)
      const next = resolveInitialLocale(stored)
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
  const next = PRIMARY_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE
  setRuntimeLocale(next)
  await SecureStore.setItemAsync(STORAGE_KEY, next)
  await i18n.changeLanguage(next)
}
