import { getTranslations } from 'next-intl/server'
import { Link } from '@/i18n.config'

// 서버 컴포넌트로 변경하여 성능 개선
export default async function HomePage() {
  const t = await getTranslations('home')
  const tCommon = await getTranslations('common')

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">{t('title')}</h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8">{t('subtitle')}</p>

          <div className="flex justify-center">
            <Link
              href="/auditions"
              className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-lg font-semibold"
            >
              {t('viewAuditions')}
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
