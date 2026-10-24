'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import EmptyState from '@/components/ui/EmptyState'
import { channelApi, type PublicChannelListItem } from '@/shared/api/channel'
import { RECRUIT_FIELD_CODES } from '@/shared/audition/recruitFields'
import { DEFAULT_IMAGES } from '@/shared/constants/fallbacks'
import {
  M_CARD,
  M_CARD_GAP,
  M_CARD_PAD,
  M_CHIP_BASE,
  M_CHIP_OFF,
  M_CHIP_ON,
  M_FILTER_ROW,
  M_PAGE_X,
} from '../../ui/mobileTokens'

/** 모바일 채널 목록: 한 줄 분야 칩 + 1열 카드. 검색 API는 그대로 두고 기본 화면에서만 입력창을 숨긴다. */
export default function MobileChannelsListPage() {
  const tChannel = useTranslations('channel')
  const tField = useTranslations('recruitField')
  const [field, setField] = useState('')
  // 분야는 서버 조건(/channels/public?category=CODE). 서버가 레거시 한글/영문 값도 코드로 정규화해 비교한다.
  const { data, isLoading, isError } = useQuery({
    queryKey: ['channels-public', '', '', field],
    queryFn: () => channelApi.listPublic(field ? { category: field } : {}),
  })
  const channels = data ?? []

  return (
    <div className="w-full min-w-0 overflow-x-hidden pb-6 pt-3" data-testid="mobile-channel-list">
      <h1 className="sr-only">{tChannel('listTitle')}</h1>
      <div className={M_FILTER_ROW} role="group" aria-label={tChannel('category')}>
        {['', ...RECRUIT_FIELD_CODES].map((code) => (
          <button
            key={code || 'ALL'}
            type="button"
            aria-pressed={field === code}
            onClick={() => setField(code)}
            className={`${M_CHIP_BASE} ${field === code ? M_CHIP_ON : M_CHIP_OFF}`}
          >
            {code ? tField(code) : tChannel('allCategories')}
          </button>
        ))}
      </div>
      <div className={`${M_PAGE_X} pt-3`}>
        {isLoading ? (
          <div className={`flex flex-col ${M_CARD_GAP}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[84px] animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : isError ? (
          <p className="py-6 text-center text-sm text-red-600">{tChannel('listLoadFailed')}</p>
        ) : channels.length === 0 ? (
          <EmptyState message={tChannel('listEmpty')} />
        ) : (
          <div className={`flex flex-col ${M_CARD_GAP}`}>
            {channels.map((c) => (
              <MobileChannelRow key={c.userId} channel={c} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MobileChannelRow({ channel }: { channel: PublicChannelListItem }) {
  const tChannel = useTranslations('channel')
  const name = (typeof channel.nickname === 'string' && channel.nickname.trim()) || tChannel('nameFallback')
  const intro = (typeof channel.introText === 'string' && channel.introText.trim()) || tChannel('descFallback')
  const avatar = channel.profileImage?.trim() || DEFAULT_IMAGES.avatar
  return (
    <Link
      href={`/channel/${channel.userId}`}
      data-testid="mobile-channel-card"
      className={`${M_CARD} ${M_CARD_PAD} flex min-h-[84px] min-w-0 items-center gap-3 text-inherit no-underline`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={avatar} alt="" className="h-14 w-14 shrink-0 rounded-full bg-neutral-100 object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-bold leading-snug text-neutral-900">{name}</h3>
        <p className="mt-0.5 line-clamp-1 break-words text-xs text-neutral-500">{intro}</p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {tChannel('subscribersVideos', {
            subs: Number(channel.subscriberCount ?? 0).toLocaleString(),
            videos: Number(channel.videoCount ?? 0).toLocaleString(),
          })}
        </p>
      </div>
      <span className="inline-flex h-9 max-w-[38%] shrink-0 items-center rounded-full border border-violet-200 px-3 text-xs font-semibold text-violet-700">
        <span className="truncate">{tChannel('viewCta')}</span>
      </span>
    </Link>
  )
}
