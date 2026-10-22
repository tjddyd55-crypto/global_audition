import * as SecureStore from 'expo-secure-store'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  ALL_OPEN_AUDIENCES,
  AUDIENCE_COUNTRY_STORAGE_KEY,
  normalizeAudienceCountry,
  type AudienceFilterOption,
} from './audience'

type AudienceCountryValue = {
  country: AudienceFilterOption
  selectCountry: (next: string) => void
}

const AudienceCountryContext = createContext<AudienceCountryValue | null>(null)

export function AudienceCountryProvider({ children }: { children: ReactNode }) {
  const [country, setCountry] = useState<AudienceFilterOption>(ALL_OPEN_AUDIENCES)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stored = await SecureStore.getItemAsync(AUDIENCE_COUNTRY_STORAGE_KEY)
        if (!cancelled) setCountry(normalizeAudienceCountry(stored))
      } catch {
        if (!cancelled) setCountry(ALL_OPEN_AUDIENCES)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectCountry = useCallback((next: string) => {
    const normalized = normalizeAudienceCountry(next)
    setCountry(normalized)
    void SecureStore.setItemAsync(AUDIENCE_COUNTRY_STORAGE_KEY, normalized).catch(() => undefined)
  }, [])

  const value = useMemo(() => ({ country, selectCountry }), [country, selectCountry])
  return <AudienceCountryContext.Provider value={value}>{children}</AudienceCountryContext.Provider>
}

export function useAudienceCountry(): AudienceCountryValue {
  const value = useContext(AudienceCountryContext)
  if (value) return value
  return { country: ALL_OPEN_AUDIENCES, selectCountry: () => undefined }
}
