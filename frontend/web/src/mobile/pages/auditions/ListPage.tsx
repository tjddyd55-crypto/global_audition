'use client'

import { useTranslations } from 'next-intl'
import AuditionList from '@/components/audition/AuditionList'
import AuditionsPageHeader from '@/components/audition/AuditionsPageHeader'

export default function MobileAuditionsListPage() {
  const t = useTranslations('auditions')
  return (
    <div className="min-h-screen w-full pt-8 pb-8">
      <AuditionsPageHeader
        title={t('listTitle')}
        titleClassName="mb-8 whitespace-normal break-words text-3xl font-bold md:text-4xl"
      />
      <AuditionList />
    </div>
  )
}
