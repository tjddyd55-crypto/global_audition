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
    <div className="container mx-auto px-4 py-8 min-h-screen max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{t('auditions')}</h1>
        <p className="text-gray-600">전 세계 기획사의 오디션에 지원해보세요</p>
      </div>
      <AuditionList />
    </div>
  )
}
