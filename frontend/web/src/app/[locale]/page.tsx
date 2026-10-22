'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import HeroSection from '../../components/home/HeroSection'
import HomeAuditionSection from '../../components/home/HomeAuditionSection'
import HomeVideoSection from '../../components/home/HomeVideoSection'
import { listBrowsePublicVideos } from '@/shared/api/channelVideoPublic'
import { channelVideoKeys } from '@/shared/query/channelVideoQuery'
import { useAudienceCountrySelection } from '@/shared/audition/useAudienceCountrySelection'
import { useAuditionsListQuery } from '@/components/audition/useAuditionsListQuery'

export default function HomePage() {
  const t = useTranslations('home')
  const { country, selectCountry } = useAudienceCountrySelection()
  const { data: auditions = [], isLoading: auditionsLoading } = useAuditionsListQuery(country)
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

      <HomeAuditionSection
        auditions={auditions}
        isLoading={auditionsLoading}
        country={country}
        onCountryChange={selectCountry}
      />
      <HomeVideoSection videos={latestVideos} isLoading={videosLoading} isError={videosError} />
    </div>
  )
}
