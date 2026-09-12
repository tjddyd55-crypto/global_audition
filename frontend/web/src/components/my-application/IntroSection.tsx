'use client'

import { useTranslations } from 'next-intl'
import { CARD_BASE, TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export type IntroSectionProps = {
  introText: string | null | undefined
}

export function IntroSection({ introText }: IntroSectionProps) {
  const tMy = useTranslations('myApplications')
  const text = introText?.trim() ?? ''

  return (
    <section className={CARD_BASE}>
      <h2 className={`${TITLE_PAGE} mb-4`}>{tMy('introTitle')}</h2>
      {text ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{introText}</p>
      ) : (
        <p className={TEXT_SUB}>{tMy('noIntro')}</p>
      )}
    </section>
  )
}
