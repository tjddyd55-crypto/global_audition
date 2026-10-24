'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'

/** 클라이언트 라우팅으로 로케일이 바뀌어도 <html lang> 을 현재 로케일로 맞춘다. */
export function HtmlLangSync() {
  const locale = useLocale()
  useEffect(() => {
    if (typeof document !== 'undefined' && locale && document.documentElement.lang !== locale) {
      document.documentElement.lang = locale
    }
  }, [locale])
  return null
}
