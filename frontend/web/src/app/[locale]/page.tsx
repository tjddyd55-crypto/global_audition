'use client'

import { useQuery } from '@tanstack/react-query'
import { Link } from '../../i18n.config'
import { useTranslations } from 'next-intl'
import { auditionApi, type AuditionResponse } from '../../lib/api/auditions'
import AuditionCard from '../../components/cards/AuditionCard'
import VideoCard from '../../components/cards/VideoCard'
import HeroSection from '../../components/home/HeroSection'
import { mockVideos } from '../../lib/mocks/videos'

const fallbackAuditions: AuditionResponse[] = [
  {
    id: 'fallback-1',
    ownerId: '0',
    title: 'K-POP 글로벌 오디션 2026',
    description: '차세대 K-POP 스타를 찾습니다. 노래, 춤, 랩 등 모든 포지션 지원 가능',
    status: 'OPEN',
    createdAt: '2026-03-15',
    category: 'K-POP',
  },
  {
    id: 'fallback-2',
    ownerId: '0',
    title: '뮤지컬 배우 공개 오디션',
    description: '2026년 대형 뮤지컬 프로젝트 주연 및 조연 배우 모집',
    status: 'OPEN',
    createdAt: '2026-03-14',
    category: 'Musical',
  },
  {
    id: 'fallback-3',
    ownerId: '0',
    title: '신인 모델 발굴 오디션',
    description: '패션위크 런웨이 모델 선발',
    status: 'OPEN',
    createdAt: '2026-03-10',
    category: 'Fashion',
  },
]

export default function HomePage() {
  const t = useTranslations('home')

  const { data: auditions } = useQuery({
    queryKey: ['auditions'],
    queryFn: () => auditionApi.listOpen(),
    retry: 1,
  })
  const auditList = auditions ?? []
  const displayAuditions = (auditList.length > 0 ? auditList : fallbackAuditions).slice(0, 3)
  const latestVideos = (mockVideos ?? []).slice(0, 3)

  return (
    <div className="w-full">
      <HeroSection
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
        auditionLabel={t('viewAuditions')}
        startLabel={t('getStarted')}
      />

      <section className="container mx-auto max-w-7xl px-4 py-16 md:py-20">
        <div className="mb-8">
          <h2 className="mb-2 text-center text-4xl font-bold text-gray-900">진행 중인 오디션</h2>
          <p className="text-center text-base text-gray-500">지금 바로 지원 가능한 오디션을 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(displayAuditions ?? []).map((audition, i) => (
            <AuditionCard key={audition?.id ?? `audition-${i}`} audition={audition} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/auditions"
            className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700"
          >
            모든 오디션 보기
          </Link>
        </div>
      </section>

      <section className="container mx-auto max-w-7xl px-4 py-20 md:py-24">
        <div className="mb-8">
          <h2 className="mb-2 text-center text-4xl font-bold text-gray-900">최신 영상</h2>
          <p className="text-center text-base text-gray-500">최근 업로드된 영상을 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(latestVideos ?? []).map((video, i) => (
            <VideoCard key={video?.id ?? `video-${i}`} video={video} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/videos"
            className="inline-flex h-10 items-center rounded-md border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700"
          >
            모든 영상 보기
          </Link>
        </div>
      </section>
    </div>
  )
}
