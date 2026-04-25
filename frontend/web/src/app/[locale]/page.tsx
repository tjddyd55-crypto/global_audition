'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { auditionApi } from '@/shared/api/auditions'
import HeroSection from '../../components/home/HeroSection'
import HomeAuditionSection from '../../components/home/HomeAuditionSection'
import HomeVideoSection from '../../components/home/HomeVideoSection'
import { listBrowsePublicVideos } from '@/shared/api/channelVideoPublic'
import { channelVideoKeys } from '@/shared/query/channelVideoQuery'

export default function HomePage() {
  const t = useTranslations('home')

  const { data: auditions = [], isLoading: auditionsLoading } = useQuery({
    queryKey: ['auditions'],
    queryFn: () => auditionApi.listOpen(),
    retry: 1,
  })
  const { data: browseVideosList = [], isLoading: videosLoading, isError: videosError } = useQuery({
    queryKey: channelVideoKeys.browse(null),
    queryFn: () => listBrowsePublicVideos(),
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  })

  const latestVideos = useMemo(() => {
    const sorted = [...browseVideosList].sort(
      (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
    )
    return sorted.slice(0, 3)
  }, [browseVideosList])

  return (
    <div>
      <HeroSection
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
        auditionLabel={t('viewAuditions')}
        startLabel={t('getStarted')}
      />

      <HomeAuditionSection auditions={auditions} isLoading={auditionsLoading} />
      <HomeVideoSection videos={latestVideos} isLoading={videosLoading} isError={videosError} />
    </div>
  )
}
