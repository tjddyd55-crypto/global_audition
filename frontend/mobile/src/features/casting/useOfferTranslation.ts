import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { contentTranslationApi } from '../../api/endpoints'
import { displayedField } from '../../../../web/src/shared/i18n/contentTranslation'

/** 웹과 같은 CASTING_OFFER 번역(비동기 큐) 결과를 읽는다. 연락처·메모는 번역 대상이 아니다. */
export function useOfferTranslation(offerId: string | undefined) {
  const { i18n } = useTranslation()
  const [showOriginal, setShowOriginal] = useState(false)
  const lang = i18n.language || 'ko'
  const query = useQuery({
    queryKey: ['content-translation', 'CASTING_OFFER', offerId, lang, showOriginal],
    enabled: Boolean(offerId),
    retry: false,
    queryFn: () => contentTranslationApi.view('CASTING_OFFER', offerId as string, lang, showOriginal),
  })
  const view = query.data ?? null
  return {
    view,
    showOriginal,
    setShowOriginal,
    text: (original: string | null | undefined, field: string) => displayedField(original, view, field, showOriginal),
  }
}
