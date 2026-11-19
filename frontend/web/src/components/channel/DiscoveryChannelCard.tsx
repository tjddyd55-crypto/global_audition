'use client'

import { useLocale, useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import type { PublicChannelListItem } from '@/shared/api/channel'
import { DEFAULT_IMAGES } from '@/shared/constants/fallbacks'
import { formatCount } from '@/shared/money/currency'
import { ChannelMetaLine } from './ChannelMeta'

function nameOf(c: PublicChannelListItem, fallback: string) {
  return (typeof c.nickname === 'string' && c.nickname.trim()) || fallback
}

function introOf(c: PublicChannelListItem) {
  return (c.shortBio ?? '').trim() || (typeof c.introText === 'string' ? c.introText.trim() : '')
}

/** PC 그리드 카드: 대표 영상 썸네일 + 아바타 + 메타 + 실제 팔로워/영상 수. */
export function DiscoveryChannelCard({ channel }: { channel: PublicChannelListItem }) {
  const t = useTranslations('channel')
  const locale = useLocale()
  const name = nameOf(channel, t('nameFallback'))
  const intro = introOf(channel)
  const avatar = channel.profileImage?.trim() || DEFAULT_IMAGES.avatar
  return (
    <Link
      href={`/channel/${channel.userId}`}
      data-testid="channel-card"
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white text-inherit no-underline transition hover:shadow-md"
    >
      <div className="relative aspect-video w-full bg-gradient-to-br from-violet-100 to-neutral-100">
        {channel.featuredThumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={channel.featuredThumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <div className="flex min-w-0 items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={avatar} alt="" loading="lazy" className="-mt-10 h-14 w-14 shrink-0 rounded-full border-4 border-white bg-neutral-100 object-cover" />
          <h3 className="min-w-0 truncate text-base font-bold text-neutral-900">{name}</h3>
        </div>
        <ChannelMetaLine
          nationality={channel.nationality}
          residence={channel.residenceCountry}
          mainField={channel.mainField}
          className="text-xs text-neutral-600"
        />
        <p className="line-clamp-2 min-h-[2.5rem] break-words text-sm text-neutral-600">{intro || t('descFallback')}</p>
        <p className="mt-auto text-xs text-neutral-500">
          {t('cardStats', {
            followers: formatCount(Number(channel.subscriberCount ?? 0), locale),
            videos: formatCount(Number(channel.videoCount ?? 0), locale),
          })}
        </p>
      </div>
    </Link>
  )
}

/** 모바일 1열 행: 좁은 폭(320px)에서도 잘리지 않게 썸네일은 오른쪽 작은 크기. */
export function DiscoveryChannelRow({ channel }: { channel: PublicChannelListItem }) {
  const t = useTranslations('channel')
  const locale = useLocale()
  const name = nameOf(channel, t('nameFallback'))
  const intro = introOf(channel)
  const avatar = channel.profileImage?.trim() || DEFAULT_IMAGES.avatar
  return (
    <Link
      href={`/channel/${channel.userId}`}
      data-testid="mobile-channel-card"
      className="flex min-h-[92px] min-w-0 items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-inherit no-underline"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatar} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-full bg-neutral-100 object-cover" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-bold leading-snug text-neutral-900">{name}</h3>
        <ChannelMetaLine
          nationality={channel.nationality}
          residence={channel.residenceCountry}
          mainField={channel.mainField}
          className="mt-0.5 text-xs text-neutral-600"
        />
        <p className="mt-0.5 line-clamp-1 break-words text-xs text-neutral-500">{intro || t('descFallback')}</p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {t('cardStats', {
            followers: formatCount(Number(channel.subscriberCount ?? 0), locale),
            videos: formatCount(Number(channel.videoCount ?? 0), locale),
          })}
        </p>
      </div>
      {channel.featuredThumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={channel.featuredThumbnailUrl} alt="" loading="lazy" className="hidden h-14 w-24 shrink-0 rounded-lg object-cover min-[360px]:block" />
      ) : null}
    </Link>
  )
}
