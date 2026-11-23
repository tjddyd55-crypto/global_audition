'use client'

import { Link } from '@/i18n.config'
import { useTranslations } from 'next-intl'
import type { PublicChannelListItem } from '@/shared/api/channel'
import { recruitFieldLabel } from '@/shared/audition/recruitFields'

export function HomeChannelCard({ channel }: { channel: PublicChannelListItem }) {
  const tCountry = useTranslations('country')
  const tField = useTranslations('recruitField')
  const tChannel = useTranslations('channel')
  const name = channel.nickname?.trim() || tChannel('nameFallback')
  const photo = channel.profileImage?.trim()
  const thumb = channel.featuredThumbnailUrl?.trim()
  const country = channel.nationality?.trim()
  const field = channel.mainField?.trim()
  let countryLabel = ''
  if (country) {
    const known = ['KR', 'MN', 'GLOBAL', 'JP', 'KH', 'UZ', 'OTHER']
    countryLabel = known.includes(country) ? tCountry(country as 'KR') : country
  }
  const fieldLabel = field ? recruitFieldLabel(field, tField) : ''
  const initial = Array.from(name)[0]?.toUpperCase() ?? '?'

  return (
    <Link
      href={`/channel/${channel.userId}`}
      data-testid="home-channel-card"
      className="flex min-w-0 items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-inherit no-underline"
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover bg-neutral-100" />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-50 text-lg font-extrabold text-violet-700">
          {initial}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-neutral-900">{name}</span>
        <span className="mt-0.5 block truncate text-xs text-neutral-500">{[countryLabel, fieldLabel].filter(Boolean).join(' · ')}</span>
      </span>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumb} alt="" className="h-[45px] w-20 shrink-0 rounded-md bg-neutral-900 object-cover" />
      ) : null}
    </Link>
  )
}
