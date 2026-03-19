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

  const containerStyle = {
    maxWidth: 1200,
    margin: '0 auto' as const,
    padding: '0 24px',
    paddingTop: 80,
    paddingBottom: 80,
  }

  return (
    <div style={containerStyle}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>{t('auditions')}</h1>
        <p style={{ fontSize: 16, color: '#666', margin: 0 }}>전 세계 기획사의 오디션에 지원해보세요</p>
      </div>
      <AuditionList />
    </div>
  )
}
