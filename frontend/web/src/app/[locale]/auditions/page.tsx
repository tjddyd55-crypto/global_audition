import { getTranslations } from 'next-intl/server'
import AuditionList from '@/components/audition/AuditionList'

export default async function AuditionsPage() {
  const t = await getTranslations('common')

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">{t('auditions')}</h1>
        <AuditionList />
      </div>
    </div>
  )
}
