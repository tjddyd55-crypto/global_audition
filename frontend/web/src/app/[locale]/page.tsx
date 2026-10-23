'use client'

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from '@/i18n.config'
import { useTranslations } from 'next-intl'
import HeroSection from '../../components/home/HeroSection'
import HomeAuditionSection from '../../components/home/HomeAuditionSection'
import HomeVideoSection from '../../components/home/HomeVideoSection'
import { listBrowsePublicVideos } from '@/shared/api/channelVideoPublic'
import { channelApi } from '@/shared/api/channel'
import { publicPlatformApi } from '@/shared/api/publicPlatform'
import { channelVideoKeys } from '@/shared/query/channelVideoQuery'
import { Link } from '@/i18n.config'
import { useAudienceCountrySelection } from '@/shared/audition/useAudienceCountrySelection'
import { useAuditionsListQuery } from '@/components/audition/useAuditionsListQuery'

const CATEGORIES = ['Vocal', 'Dance', 'Rap']

export default function HomePage() {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const [query, setQuery] = useState('')
  const { country, selectCountry } = useAudienceCountrySelection()
  const { data: auditions = [], isLoading: auditionsLoading } = useAuditionsListQuery(country)
  const { data: browseVideosList = [], isLoading: videosLoading, isError: videosError } = useQuery({
    queryKey: channelVideoKeys.browse(null),
    queryFn: () => listBrowsePublicVideos(),
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
  })
  const channels = useQuery({ queryKey: ['public-home-channels'], queryFn: () => channelApi.listPublic() })
  const agencies = useQuery({ queryKey: ['public-home-agencies'], queryFn: () => publicPlatformApi.agencies() })

  const latestVideos = useMemo(() => {
    const sorted = [...browseVideosList].sort(
      (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime(),
    )
    return sorted.slice(0, 3)
  }, [browseVideosList])
  const featured = auditions.slice(0, 3)
  const latestAuditions = auditions.slice(3, 6)

  return (
    <div>
      <HeroSection
        title={t('heroTitle')}
        subtitle={t('heroSubtitle')}
        auditionLabel={t('viewAuditions')}
        startLabel={t('getStarted')}
      />
      <form
        className="mx-auto flex max-w-3xl flex-col gap-2 px-6 pb-2 sm:flex-row"
        onSubmit={(event) => {
          event.preventDefault()
          const text = query.trim()
          router.push(text ? `/auditions?q=${encodeURIComponent(text)}` : '/auditions')
        }}
      >
        <input
          className="h-11 flex-1 rounded-lg border border-neutral-300 px-3 text-sm"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
        />
        <div className="flex gap-2 sm:contents">
          <button type="submit" className="h-11 flex-1 rounded-lg bg-neutral-900 px-4 text-sm font-semibold text-white sm:flex-none">
            {tCommon('search')}
          </button>
          <Link href="/register" className="inline-flex h-11 flex-1 items-center justify-center rounded-lg border border-neutral-300 px-4 text-sm font-medium sm:flex-none">
            {t('signup')}
          </Link>
        </div>
      </form>
      <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-6 pb-2 sm:flex-wrap">
        {CATEGORIES.map((category) => (
          <Link key={category} href={`/auditions?category=${category}`} className="rounded-full border border-neutral-300 px-3 py-1 text-sm">
            {category}
          </Link>
        ))}
        <Link href="/videos" className="rounded-full border border-neutral-300 px-3 py-1 text-sm">
          {tCommon('videos')}
        </Link>
        <Link href="/channels" className="rounded-full border border-neutral-300 px-3 py-1 text-sm">
          {tCommon('channels')}
        </Link>
        <Link href="/agencies" className="rounded-full border border-neutral-300 px-3 py-1 text-sm">
          {tCommon('agencies')}
        </Link>
      </div>

      <HomeAuditionSection
        heading={t('featuredAuditions')}
        compact
        auditions={featured}
        isLoading={auditionsLoading}
        country={country}
        onCountryChange={selectCountry}
      />
      <HomeAuditionSection
        heading={t('latestAuditions')}
        compact
        auditions={latestAuditions}
        isLoading={auditionsLoading}
        country={country}
        onCountryChange={selectCountry}
        showFilter={false}
      />
      <HomeVideoSection videos={latestVideos} isLoading={videosLoading} isError={videosError} />
      <section className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="mb-4 text-2xl font-bold">{t('channels')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(channels.data ?? []).slice(0, 4).map((channel) => (
            <Link key={channel.userId} href={`/channel/${channel.userId}`} className="rounded-lg border border-neutral-200 p-3">
              <div className="font-medium">{channel.nickname}</div>
              <div className="text-sm text-neutral-600">{channel.introText}</div>
            </Link>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-6 pb-12">
        <h2 className="mb-4 text-2xl font-bold">{t('agencies')}</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(agencies.data ?? []).slice(0, 4).map((agency) => (
            <Link key={agency.id} href={`/agencies/${agency.id}`} className="rounded-lg border border-neutral-200 p-3">
              <div className="font-medium">{agency.displayName}</div>
              <div className="text-sm text-neutral-600">{agency.countryCode}</div>
            </Link>
          ))}
        </div>
        <Link href="/agencies" className="mt-4 inline-block text-sm underline">
          {t('seeAllAgencies')}
        </Link>
      </section>
    </div>
  )
}
