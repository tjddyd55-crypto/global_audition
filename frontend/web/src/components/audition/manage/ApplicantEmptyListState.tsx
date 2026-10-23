'use client'

import { useTranslations } from 'next-intl'
import { CARD_BASE, TEXT_SUB } from '@/shared/ui/specClasses'

export default function ApplicantEmptyListState() {
  const t = useTranslations('agency')
  return (
    <div className={CARD_BASE}>
      <p className={`${TEXT_SUB} text-center`}>{t('emptyVisible')}</p>
    </div>
  )
}
