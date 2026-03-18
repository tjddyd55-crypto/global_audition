'use client'

import { useQuery } from '@tanstack/react-query'
import { Link } from '../../i18n.config'
import { useTranslations } from 'next-intl'
import { auditionApi, type AuditionResponse } from '../../lib/api/auditions'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import Image from 'next/image'

/* Figma Home: hero + 진행 중인 오디션(실제 API) + 최신 영상(목업) + CTA */

/** 목업: 영상 API 연동 전까지 피그마와 동일한 카드 표시용 */
const MOCK_LATEST_VIDEOS = [
  {
    id: '1',
    title: 'Vocal Performance - "Rise Up"',
    description: '나의 첫 보컬 퍼포먼스 영상입니다. 많은 응원 부탁드립니다!',
    category: 'Vocal',
    views: 15234,
    likes: 892,
    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=300&fit=crop',
    channelId: '1',
    channelName: '지수 Kim',
    channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
  {
    id: '2',
    title: 'Dance Cover - New Jeans "OMG"',
    description: '뉴진스 OMG 커버 댄스입니다',
    category: 'Dance',
    views: 23456,
    likes: 1234,
    thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400&h=300&fit=crop',
    channelId: '1',
    channelName: '지수 Kim',
    channelAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
  {
    id: '3',
    title: 'Freestyle Dance Performance',
    description: '최신 힙합 트랙에 맞춘 프리스타일 댄스',
    category: 'Dance',
    views: 18901,
    likes: 1045,
    thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc9498cfd8?w=400&h=300&fit=crop',
    channelId: '2',
    channelName: '민준 Park',
    channelAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  },
] as const

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
              {t('heroTitle') || t('title')}
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              {t('heroSubtitle') || t('subtitle')}
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

      {/* 최신 영상 - Figma 카드 레이아웃, 목업 데이터 (API 연동 시 교체) */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2 text-center">최신 영상</h2>
          <p className="text-gray-600 text-center">최근 업로드된 영상을 확인하세요</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_LATEST_VIDEOS.map((video) => (
            <div key={video.id} className="group">
              <article className="h-full rounded-xl border-2 border-gray-100 bg-white overflow-hidden shadow-sm transition-all hover:scale-[1.02] hover:border-purple-200 hover:shadow-lg cursor-pointer">
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  <Image
                    src={video.thumbnail}
                    alt={video.title}
                    width={400}
                    height={300}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="w-6 h-6 text-purple-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </div>
                  <span className="absolute top-2 right-2 rounded bg-purple-600 px-2 py-0.5 text-xs font-medium text-white border-0">
                    {video.category}
                  </span>
                </div>
                <div className="p-4">
                  <Link
                    href={`/channel/${video.channelId}`}
                    className="flex items-center gap-2 mb-3 hover:opacity-75 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-purple-100 flex-shrink-0">
                      <Image
                        src={video.channelAvatar}
                        alt={video.channelName}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{video.channelName}</span>
                  </Link>
                  <h3 className="font-semibold text-base mb-2 line-clamp-2">{video.title}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{video.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      {video.views.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                      {video.likes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link
            href="/videos"
            className="inline-flex items-center justify-center rounded-lg border-2 border-gray-300 px-6 py-3 font-medium hover:bg-gray-50"
          >
            모든 영상 보기
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
