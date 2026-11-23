'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { AuditionAudienceFilter } from '@/components/audition/AuditionAudienceFilter'
import EmptyState from '@/components/ui/EmptyState'
import { HomeAuditionCard } from '@/components/home/HomeAuditionCard'
import { HomeChannelCard } from '@/shared/home/HomeChannelCard'
import { useHomeFeed } from '@/components/home/useHomeFeed'
import type { AuditionDto } from '@/shared/types/audition'
import type { RecommendedAuditionItem } from '@/shared/api/auditionRecommendations'
import type { PublicChannelListItem } from '@/shared/api/channel'

export default function PcHomePage() {
  const tHome = useTranslations('home')
  const tRec = useTranslations('recommend')
  const feed = useHomeFeed()
  const recoTitle = feed.isAuthenticated && feed.personalized ? tRec('title') : tRec('guestTitle')

  return (
    <div className="pb-12">
      <section data-testid="home-brand-banner" className="mx-auto max-w-5xl px-6 pt-6">
        <div className="rounded-2xl border border-violet-100 bg-violet-50 px-6 py-5">
          <p className="text-2xl font-extrabold tracking-wide text-violet-700">{tHome('brandName')}</p>
          <p className="mt-1 text-sm leading-5 text-neutral-700">{tHome('brandTagline')}</p>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pt-5">
        <AuditionAudienceFilter country={feed.country} onChange={feed.selectCountry} />
      </div>

      <HomeSection title={recoTitle} href="/auditions" seeAll={tHome('seeAll')} testId="home-recommended">
        {feed.recommendedPending ? <SkeletonGrid /> : null}
        {!feed.recommendedPending && feed.recommended.length === 0 ? <EmptyState message={tHome('emptyBody')} /> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {feed.recommended.map((item: RecommendedAuditionItem) => (
            <HomeAuditionCard
              key={item.audition.id}
              audition={item.audition}
              reasons={item.reasons}
              eligibility={item.eligibility}
            />
          ))}
        </div>
      </HomeSection>

      {feed.closingSoon.length > 0 || feed.closingPending ? (
        <HomeSection title={tRec('closingSoonTitle')} href="/auditions" seeAll={tHome('seeAll')} testId="home-closing-soon">
          {feed.closingPending ? <SkeletonGrid /> : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {feed.closingSoon.map((audition: AuditionDto) => (
              <HomeAuditionCard key={audition.id} audition={audition} />
            ))}
          </div>
        </HomeSection>
      ) : null}

      {feed.channels.length > 0 || feed.channelsPending ? (
        <HomeSection title={tRec('channelsTitle')} href="/channels" seeAll={tHome('seeAll')} testId="home-channels">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {feed.channels.map((channel: PublicChannelListItem) => (
              <HomeChannelCard key={channel.userId} channel={channel} />
            ))}
          </div>
        </HomeSection>
      ) : null}

      <HomeSection title={tRec('latestTitle')} href="/auditions" seeAll={tHome('seeAll')} testId="home-latest">
        {feed.latestPending ? <SkeletonGrid /> : null}
        {!feed.latestPending && feed.latest.length === 0 ? <EmptyState message={tHome('emptyBody')} /> : null}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {feed.latest.map((audition: AuditionDto) => (
            <HomeAuditionCard key={audition.id} audition={audition} />
          ))}
        </div>
      </HomeSection>
    </div>
  )
}

function HomeSection({
  title,
  href,
  seeAll,
  testId,
  children,
}: {
  title: string
  href: string
  seeAll: string
  testId: string
  children: ReactNode
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-8" data-testid={testId}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-2xl font-bold leading-tight text-neutral-900">{title}</h2>
        <Link href={href} className="shrink-0 text-sm font-medium text-violet-700 no-underline">
          {seeAll}
        </Link>
      </div>
      {children}
    </section>
  )
}

function SkeletonGrid() {
  return (
    <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-40 animate-pulse rounded-xl bg-neutral-100" />
      ))}
    </div>
  )
}
