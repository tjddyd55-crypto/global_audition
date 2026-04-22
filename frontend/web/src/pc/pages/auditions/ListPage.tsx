import { getTranslations, setRequestLocale } from 'next-intl/server'
import AuditionList from '@/components/audition/AuditionList'

/**
 * PC 오디션 목록 페이지.
 * 서버 컴포넌트이며 locale을 받아 i18n 메시지를 사용한다.
 */
export default async function PcAuditionsListPage({ locale }: { locale: string }) {
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
