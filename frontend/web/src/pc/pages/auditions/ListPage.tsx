import { getTranslations, setRequestLocale } from 'next-intl/server'
import AuditionList from '@/components/audition/AuditionList'
import AuditionsPageHeader from '@/components/audition/AuditionsPageHeader'

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
      <AuditionsPageHeader
        title={t('auditions')}
        description="전 세계 기획사의 오디션에 지원해보세요"
        className="w-full"
        style={{ marginBottom: 24 }}
        titleStyle={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px 0' }}
        descriptionStyle={{ fontSize: 16, color: '#666', margin: 0 }}
      />
      <AuditionList />
    </div>
  )
}
