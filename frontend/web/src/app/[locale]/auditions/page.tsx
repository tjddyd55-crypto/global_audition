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

  const pageStyle = {
    width: '100%' as const,
    paddingTop: 80,
    paddingBottom: 80,
  }

  return (
    <div style={pageStyle}>
      <div
        className="w-full"
        style={{
          marginBottom: 24,
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}>{t('auditions')}</h1>
        <p style={{ fontSize: 16, color: '#666', margin: 0 }}>전 세계 기획사의 오디션에 지원해보세요</p>
      </div>
      <AuditionList />
    </div>
  )
}
