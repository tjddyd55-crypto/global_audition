'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  ALL_OPEN_AUDIENCES,
  AUDIENCE_COUNTRY_STORAGE_KEY,
  normalizeAudienceCountry,
  type AudienceFilterOption,
} from './audienceSelection'

/** 선택한 국가. 기본은 공개 OPEN 전체이고, 언어를 바꿔도 저장값을 유지한다. */
export function useAudienceCountrySelection() {
  const [country, setCountry] = useState<AudienceFilterOption>(ALL_OPEN_AUDIENCES)

  useEffect(() => {
    try {
      setCountry(normalizeAudienceCountry(window.localStorage.getItem(AUDIENCE_COUNTRY_STORAGE_KEY)))
    } catch {
      setCountry(ALL_OPEN_AUDIENCES)
    }
  }, [])

  const selectCountry = useCallback((next: string) => {
    const normalized = normalizeAudienceCountry(next)
    setCountry(normalized)
    try {
      window.localStorage.setItem(AUDIENCE_COUNTRY_STORAGE_KEY, normalized)
    } catch {
      // 저장 실패여도 이번 화면의 선택은 유지한다.
    }
  }, [])

  return { country, selectCountry }
}
