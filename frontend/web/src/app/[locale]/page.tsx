'use client'

import { useQuery } from '@tanstack/react-query'
import { Link } from '../../i18n.config'
import { useTranslations } from 'next-intl'
import { auditionApi, type AuditionResponse } from '../../lib/api/auditions'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

/* Figma Home: hero + 진행 중인 오디션(실제 API) + 최신 영상(플레이스홀더) + CTA */

const statusLabels: Record<string, string> = {
  DRAFT: '초안',
  OPEN: '모집중',
  CLOSED: '마감',
}

function StatusBadge({ status }: { status: string }) {
  const style =
    status === 'OPEN'
      ? 'bg-green-100 text-green-700 border-green-200'
      : status === 'CLOSED'
        ? 'bg-gray-100 text-gray-700 border-gray-200'
        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}>
      {statusLabels[status] ?? status}
    </span>
  )
}

export default function HomePage() {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')

  const { data: auditions = [], isLoading } = useQuery({
    queryKey: ['auditions'],
    queryFn: () => auditionApi.listOpen(),
  })
  const displayAuditions = auditions.slice(0, 6)

  return (
    <div className="w-full">
      {/* Hero - Figma: purple-pink gradient, gradient title */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-50 via-pink-50 to-white">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239333ea' fill-opacity='0.05'%3E%3Cpath d='M36 14h2V6h-2zM30 14h2V6h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="container mx-auto px-4 py-16 md:py-24 relative">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auditions"
                className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-white font-medium shadow-lg hover:from-purple-700 hover:to-pink-700 hover:shadow-xl transition-all"
              >
                {t('viewAuditions')}
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border-2 border-purple-600 bg-transparent px-6 py-3 text-purple-600 font-medium hover:bg-purple-50 transition-all"
              >
                {tCommon('register')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 진행 중인 오디션 - Figma card grid, 실 API */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-center">진행 중인 오디션</h2>
          <p className="text-gray-600 text-center">지금 바로 지원 가능한 오디션을 확인하세요</p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-500">로딩 중...</div>
        ) : displayAuditions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">등록된 오디션이 없습니다</p>
            <Link
              href="/auditions"
              className="text-purple-600 hover:underline font-medium"
            >
              오디션 목록
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayAuditions.map((audition: AuditionResponse) => (
                <Link key={audition.id} href={`/auditions/${audition.id}`}>
                  <article className="h-full rounded-xl border-2 border-gray-100 bg-white p-5 shadow-sm transition-all hover:scale-[1.02] hover:border-purple-200 hover:shadow-lg cursor-pointer">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-semibold leading-tight line-clamp-2">
                        {audition.title}
                      </h3>
                      <StatusBadge status={audition.status} />
                    </div>
                    {audition.category && (
                      <span className="inline-flex rounded-md border px-2 py-0.5 text-xs font-medium mb-2">
                        {audition.category}
                      </span>
                    )}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {audition.description || '상세 내용은 오디션 상세에서 확인하세요'}
                    </p>
                    <p className="flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {format(new Date(audition.createdAt), 'yyyy.MM.dd', { locale: ko })}
                    </p>
                  </article>
                </Link>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="/auditions"
                className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 px-6 py-3 font-medium hover:bg-gray-50"
              >
                모든 오디션 보기
              </Link>
            </div>
          </>
        )}
      </section>

      {/* 최신 영상 - Figma 스타일, 영상 API 없음 → CTA만 */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-center">최신 영상</h2>
          <p className="text-gray-600 text-center">최근 업로드된 영상을 확인하세요</p>
        </div>
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-12 text-center">
          <p className="text-gray-500 mb-4">영상 피드가 준비되면 여기에 표시됩니다</p>
          <Link
            href="/videos"
            className="inline-flex items-center justify-center rounded-lg border-2 border-purple-600 px-6 py-3 font-medium text-purple-600 hover:bg-purple-50"
          >
            영상 보기
          </Link>
        </div>
      </section>

      {/* CTA - Figma: full-width gradient strip */}
      <section className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">지금 시작하세요</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            기회를 놓치지 마세요. 오늘 바로 오디션에 지원해보세요.
          </p>
          <Link
            href="/auditions"
            className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-purple-600 font-semibold shadow-lg hover:bg-gray-100 transition-all"
          >
            오디션 둘러보기
          </Link>
        </div>
      </section>
    </div>
  )
}
