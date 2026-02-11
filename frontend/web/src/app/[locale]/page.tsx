import { getTranslations, setRequestLocale } from 'next-intl/server'
import { Link } from '../../i18n.config'

// 서버 컴포넌트로 변경하여 성능 개선
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  
  // 정적 렌더링을 위해 setRequestLocale 호출 (필수)
  setRequestLocale(locale)
  
  const t = await getTranslations('home')
  const tCommon = await getTranslations('common')

  return (
    <>
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              {t('title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              {t('subtitle')}
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/auditions"
                className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                {t('viewAuditions')}
              </Link>
              <Link
                href="/register"
                className="px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200 text-lg font-semibold shadow-md hover:shadow-lg"
              >
                {tCommon('register')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 기능 소개 섹션 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              주요 기능
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              오디션 플랫폼의 핵심 기능을 확인하세요
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 기능 카드 1 */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('feature1Title')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('feature1Desc')}
              </p>
            </div>

            {/* 기능 카드 2 */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('feature2Title')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('feature2Desc')}
              </p>
            </div>

            {/* 기능 카드 3 */}
            <div className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 border border-gray-100 transform hover:-translate-y-2">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('feature3Title')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('feature3Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 섹션 */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            지금 시작하세요
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            기회를 놓치지 마세요. 오늘 바로 오디션에 지원해보세요.
          </p>
          <Link
            href="/auditions"
            className="inline-block px-8 py-4 bg-white text-primary-600 rounded-lg hover:bg-gray-50 transition-all duration-200 text-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            오디션 둘러보기
          </Link>
        </div>
      </section>
    </>
  )
}
