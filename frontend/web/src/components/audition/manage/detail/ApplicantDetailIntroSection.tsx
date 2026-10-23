'use client'

import { useTranslations } from 'next-intl'
import { TranslationNotice, translatedText, useContentTranslation } from '@/components/i18n/TranslatedField'

type ApplicantDetailIntroSectionProps = {
  applicationId: string
  introText?: string | null
}

export default function ApplicantDetailIntroSection({ applicationId, introText }: ApplicantDetailIntroSectionProps) {
  const tAgency = useTranslations('agency')
  const copy = useContentTranslation('APPLICATION_INTRO', applicationId)
  const translated = translatedText(introText, copy.view, 'introText', copy.showOriginal)
  const content = translated.trim() ? translated : tAgency('noIntro')

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{tAgency('introTitle')}</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{content}</p>
      {introText?.trim() ? (
        <TranslationNotice view={copy.view} showOriginal={copy.showOriginal} onToggle={copy.setShowOriginal} />
      ) : null}
    </section>
  )
}
