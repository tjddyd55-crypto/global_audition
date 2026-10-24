'use client'

import { DEV_HERO_IMAGE } from './devAssets'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { useAudienceCountrySelection } from '@/shared/audition/useAudienceCountrySelection'
import { useAuditionsListQuery } from '@/components/audition/useAuditionsListQuery'
import { ALL_OPEN_AUDIENCES, type AudienceFilterOption } from '@/shared/audition/audienceSelection'
import EmptyState from '@/components/ui/EmptyState'
import type { AuditionDto } from '@/shared/types/audition'
import MobileAuditionRowCard from './components/MobileAuditionRowCard'

/** 모집 국가 타일. 값은 기존 오디션 국가 필터(AUDIENCE_FILTER_OPTIONS)와 같다. UI 언어와 무관하다. */
const COUNTRY_TILES: Array<{ code: Exclude<AudienceFilterOption, 'ALL'>; flag: string }> = [
  { code: 'KR', flag: '🇰🇷' },
  { code: 'MN', flag: '🇲🇳' },
  { code: 'JP', flag: '🇯🇵' },
  { code: 'OTHER', flag: '🌐' },
]

export default function MobileHomePage() {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')
  const tCountry = useTranslations('country')
  const { country, selectCountry } = useAudienceCountrySelection()
  const { data: auditions = [], isLoading } = useAuditionsListQuery(country)
  // 기존 홈과 같은 분할: 앞 3건 / 다음 3건
  const recruiting = auditions.slice(0, 3)
  const recommended = auditions.slice(3, 6)

  return (
    <div className="w-full min-w-0 overflow-x-hidden pb-8" data-testid="mobile-home">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2e1065] via-[#7c3aed] to-[#db2777] px-4 pb-6 pt-7 text-white">
        {/* DEV/DUMMY 히어로 배경 — 기존 그라디언트가 위에 오버레이됨 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={DEV_HERO_IMAGE}
          alt=""
          aria-hidden
          data-testid="mobile-hero-bg"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#2e1065]/85 via-[#7c3aed]/60 to-[#db2777]/75" />
        <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-pink-400/40 blur-2xl" />
        <div aria-hidden className="pointer-events-none absolute right-16 top-16 h-16 w-16 rounded-full bg-white/30 blur-xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-8 left-1/3 h-24 w-24 rounded-full bg-fuchsia-300/30 blur-2xl" />
        <div className="relative">
          <h1 className="break-words text-[28px] font-extrabold leading-tight">{t('heroTitle')}</h1>
          <p className="mt-1 break-words text-sm text-white/90">{t('heroSubtitle')}</p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link
              href="/auditions"
              className="flex min-h-11 min-w-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#7c3aed] to-[#ec4899] px-2 text-center text-sm font-semibold text-white no-underline shadow"
            >
              <span className="break-words">{t('viewAuditions')}</span>
            </Link>
            <Link
              href="/channels"
              className="flex min-h-11 min-w-0 items-center justify-center rounded-xl border border-pink-200 bg-white px-2 text-center text-sm font-semibold text-violet-700 no-underline"
            >
              <span className="break-words">{tCommon('channels')}</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 pt-6">
        <h2 className="mb-3 text-xl font-bold">{t('recruitCountries')}</h2>
        <div className="grid grid-cols-4 gap-2" role="group" aria-label={t('recruitCountries')}>
          {COUNTRY_TILES.map(({ code, flag }) => {
            const active = country === code
            return (
              <button
                key={code}
                type="button"
                data-testid={`country-tile-${code}`}
                aria-pressed={active}
                onClick={() => selectCountry(active ? ALL_OPEN_AUDIENCES : code)}
                className={`flex min-w-0 flex-col items-center justify-center gap-1 rounded-xl border px-1 py-3 ${
                  active ? 'border-violet-500 bg-violet-50' : 'border-neutral-200 bg-white'
                }`}
              >
                <span aria-hidden className="text-[32px] leading-none">
                  {flag}
                </span>
                <span className="w-full break-words text-center text-xs font-medium text-neutral-800">{tCountry(code)}</span>
              </button>
            )
          })}
        </div>
      </section>

      <AuditionRowSection
        testId="mobile-recruiting"
        heading={t('recruitingNow')}
        seeAll={t('seeAll')}
        auditions={recruiting}
        isLoading={isLoading}
        emptyMessage={t('emptyBody')}
      />
      <AuditionRowSection
        testId="mobile-recommended"
        heading={t('featuredAuditions')}
        seeAll={t('seeAll')}
        auditions={recommended}
        isLoading={isLoading}
        emptyMessage={t('emptyBody')}
        badge="recommended"
      />
    </div>
  )
}

function AuditionRowSection({
  testId,
  heading,
  seeAll,
  auditions,
  isLoading,
  emptyMessage,
  badge,
}: {
  testId: string
  heading: string
  seeAll: string
  auditions: AuditionDto[]
  isLoading: boolean
  emptyMessage: string
  badge?: 'status' | 'recommended'
}) {
  return (
    <section className="px-4 pt-7" data-testid={testId}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="min-w-0 break-words text-xl font-bold">{heading}</h2>
        <Link href="/auditions" className="shrink-0 text-sm font-medium text-violet-700 no-underline">
          {seeAll} ›
        </Link>
      </div>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      ) : auditions.length === 0 ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <div className="flex flex-col gap-3">
          {auditions.map((audition) => (
            <MobileAuditionRowCard key={audition.id} audition={audition} badge={badge} />
          ))}
        </div>
      )}
    </section>
  )
}
