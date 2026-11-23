'use client'

import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { useHomeFeed } from '@/shared/home/useHomeFeed'
import { ALL_OPEN_AUDIENCES, type AudienceFilterOption } from '@/shared/audition/audienceSelection'
import EmptyState from '@/components/ui/EmptyState'
import type { AuditionDto } from '@/shared/types/audition'
import type { RecommendedAuditionItem } from '@/shared/api/auditionRecommendations'
import type { PublicChannelListItem } from '@/shared/api/channel'
import MobileAuditionRowCard from './components/MobileAuditionRowCard'
import { HomeChannelCard } from '@/shared/home/HomeChannelCard'
import FlagIcon from '../../components/FlagIcon'
import { M_CARD_GAP, M_PAGE_X, M_SECTION_HEAD, M_SECTION_TITLE, M_SECTION_TOP } from '../../ui/mobileTokens'

/** 모집 국가 타일. 값은 기존 오디션 국가 필터와 같다. UI 언어와 무관하다. */
const COUNTRY_TILES: Array<Exclude<AudienceFilterOption, 'ALL'>> = ['KR', 'MN', 'JP', 'KH', 'UZ', 'OTHER']

export default function MobileHomePage() {
  const t = useTranslations('home')
  const tRec = useTranslations('recommend')
  const tCountry = useTranslations('country')
  const feed = useHomeFeed()
  const recoTitle = feed.isAuthenticated && feed.personalized ? tRec('title') : tRec('guestTitle')

  return (
    <div className="w-full min-w-0 overflow-x-hidden pb-8" data-testid="mobile-home">
      <section data-testid="home-brand-banner" className="bg-violet-50 px-4 py-4">
        <h1 className="break-words text-xl font-extrabold tracking-wide text-violet-700">{t('brandName')}</h1>
        <p className="mt-1 break-words text-sm leading-5 text-neutral-700">{t('brandTagline')}</p>
      </section>

      <section className={`${M_PAGE_X} ${M_SECTION_TOP}`}>
        <div className={M_SECTION_HEAD}>
          <h2 className={M_SECTION_TITLE}>{t('recruitCountries')}</h2>
        </div>
        <div className="grid grid-cols-3 gap-2" role="group" aria-label={t('recruitCountries')}>
          {COUNTRY_TILES.map((code) => {
            const active = feed.country === code
            return (
              <button
                key={code}
                type="button"
                data-testid={`country-tile-${code}`}
                aria-pressed={active}
                onClick={() => feed.selectCountry(active ? ALL_OPEN_AUDIENCES : code)}
                className={`flex h-[76px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 ${
                  active ? 'border-violet-500 bg-violet-50' : 'border-neutral-200 bg-white'
                }`}
              >
                <span className="flex h-8 items-center justify-center">
                  <FlagIcon code={code} />
                </span>
                <span className="w-full truncate text-center text-xs font-medium leading-tight text-neutral-800">{tCountry(code)}</span>
              </button>
            )
          })}
        </div>
      </section>

      <AuditionRowSection
        testId="mobile-recommended"
        heading={recoTitle}
        seeAll={t('seeAll')}
        href="/auditions"
        isLoading={feed.recommendedPending}
        emptyMessage={t('emptyBody')}
      >
        {feed.recommended.map((item: RecommendedAuditionItem) => (
          <MobileAuditionRowCard
            key={item.audition.id}
            audition={item.audition}
            badge="recommended"
            reasons={item.reasons}
            eligibility={item.eligibility}
          />
        ))}
      </AuditionRowSection>

      {feed.closingSoon.length > 0 || feed.closingPending ? (
        <AuditionRowSection
          testId="mobile-closing-soon"
          heading={tRec('closingSoonTitle')}
          seeAll={t('seeAll')}
          href="/auditions"
          isLoading={feed.closingPending}
          emptyMessage={t('emptyBody')}
        >
          {feed.closingSoon.map((audition: AuditionDto) => (
            <MobileAuditionRowCard key={audition.id} audition={audition} />
          ))}
        </AuditionRowSection>
      ) : null}

      {feed.channels.length > 0 || feed.channelsPending ? (
        <section className={`${M_PAGE_X} ${M_SECTION_TOP}`} data-testid="mobile-channels">
          <div className={M_SECTION_HEAD}>
            <h2 className={M_SECTION_TITLE}>{tRec('channelsTitle')}</h2>
            <Link href="/channels" className="inline-flex shrink-0 items-center text-sm font-medium leading-none text-violet-700 no-underline">
              {t('seeAll')} ›
            </Link>
          </div>
          <div className={`flex flex-col ${M_CARD_GAP}`}>
            {feed.channels.map((channel: PublicChannelListItem) => (
              <HomeChannelCard key={channel.userId} channel={channel} />
            ))}
          </div>
        </section>
      ) : null}

      <AuditionRowSection
        testId="mobile-latest"
        heading={tRec('latestTitle')}
        seeAll={t('seeAll')}
        href="/auditions"
        isLoading={feed.latestPending}
        emptyMessage={t('emptyBody')}
      >
        {feed.latest.map((audition: AuditionDto) => (
          <MobileAuditionRowCard key={audition.id} audition={audition} />
        ))}
      </AuditionRowSection>
    </div>
  )
}

function AuditionRowSection({
  testId,
  heading,
  seeAll,
  href,
  isLoading,
  emptyMessage,
  children,
}: {
  testId: string
  heading: string
  seeAll: string
  href: string
  isLoading: boolean
  emptyMessage: string
  children: ReactNode
}) {
  const items = Array.isArray(children) ? children : children ? [children] : []
  const count = items.filter(Boolean).length
  return (
    <section className={`${M_PAGE_X} ${M_SECTION_TOP}`} data-testid={testId}>
      <div className={M_SECTION_HEAD}>
        <h2 className={M_SECTION_TITLE}>{heading}</h2>
        <Link href={href} className="inline-flex shrink-0 items-center text-sm font-medium leading-none text-violet-700 no-underline">
          {seeAll} ›
        </Link>
      </div>
      {isLoading ? (
        <div className={`flex flex-col ${M_CARD_GAP}`}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[124px] animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : count === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className={`flex flex-col ${M_CARD_GAP}`}>{children}</div>
      )}
    </section>
  )
}
