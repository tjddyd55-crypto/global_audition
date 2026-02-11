import { getTranslations, setRequestLocale } from 'next-intl/server'
import AuditionList from '../../../components/audition/AuditionList'

export default async function AuditionsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // 정적 렌더링을 위해 setRequestLocale 호출 (필수)
  setRequestLocale(locale)
  
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
