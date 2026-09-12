'use client'

import { useTranslations } from 'next-intl'

type ApplicantDetailIntroSectionProps = {
  introText?: string | null
}

export default function ApplicantDetailIntroSection({ introText }: ApplicantDetailIntroSectionProps) {
  const tAgency = useTranslations('agency')
  const content = introText?.trim() ? introText : tAgency('noIntro')

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-gray-900">{tAgency('introTitle')}</h3>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">{content}</p>
    </section>
  )
}
