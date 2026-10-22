'use client'

import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'
import { apiClient } from '@/shared/api/client'
import {
  displayedField,
  translationNotice,
  type ContentTranslationView,
} from '@/shared/i18n/contentTranslation'

export function useContentTranslation(contentType: string, contentId: string | undefined) {
  const locale = useLocale()
  const [showOriginal, setShowOriginal] = useState(false)
  const query = useQuery({
    queryKey: ['content-translation', contentType, contentId, locale, showOriginal],
    enabled: Boolean(contentId),
    retry: false,
    queryFn: async (): Promise<ContentTranslationView | null> => {
      try {
        const { data } = await apiClient.get<ContentTranslationView>(
          `/content-translations/${contentType}/${contentId}`,
          { params: { locale, original: showOriginal } },
        )
        return data
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null
        throw error
      }
    },
  })
  return { view: query.data ?? null, showOriginal, setShowOriginal }
}

export function TranslationNotice({
  view,
  showOriginal,
  onToggle,
}: {
  view: ContentTranslationView | null
  showOriginal: boolean
  onToggle: (next: boolean) => void
}) {
  const t = useTranslations('translation')
  const notice = translationNotice(view, showOriginal)
  if (!notice && !view) return null
  if (!view) return null
  return (
    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
      {view.sourceLocale ? <span>{t('sourceLocale', { locale: view.sourceLocale })}</span> : null}
      {notice === 'original' ? <span>{t('showingOriginal')}</span> : null}
      {notice === 'stale' ? <span>{t('stale')}</span> : null}
      <button type="button" className="underline" onClick={() => onToggle(!showOriginal)}>
        {showOriginal ? t('viewTranslation') : t('viewOriginal')}
      </button>
    </div>
  )
}

export function translatedText(
  original: string | null | undefined,
  view: ContentTranslationView | null,
  field: string,
  showOriginal: boolean,
): string {
  return displayedField(original, view, field, showOriginal)
}
