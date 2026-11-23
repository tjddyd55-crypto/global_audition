'use client'

import { useTranslations } from 'next-intl'
import SavedAuditionList from '@/components/saves/SavedAuditionList'
import { TEXT_SUB, TITLE_PAGE } from '@/shared/ui/specClasses'

export default function StudioSavedAuditionsPage() {
  const t = useTranslations('savedAuditions')
  return (
    <div className="flex flex-col gap-4">
      <h2 className={TITLE_PAGE}>{t('title')}</h2>
      <p className={TEXT_SUB}>{t('menu')}</p>
      <SavedAuditionList />
    </div>
  )
}
