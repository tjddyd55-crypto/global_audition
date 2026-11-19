'use client'

import { useTranslations } from 'next-intl'
import EmptyState from '@/components/ui/EmptyState'
import { ChannelDiscoveryFilters } from '@/components/channel/ChannelDiscoveryFilters'
import { DiscoveryChannelRow } from '@/components/channel/DiscoveryChannelCard'
import { useChannelDiscovery } from '@/shared/channel/useChannelDiscovery'
import { M_CARD_GAP, M_PAGE_X } from '../../ui/mobileTokens'

/** 모바일 채널 목록: 검색 + 국가/분야 가로 칩 + 정렬 + 1열 목록. */
export default function MobileChannelsListPage() {
  const t = useTranslations('channel')
  const d = useChannelDiscovery()
  return (
    <div className="w-full min-w-0 overflow-x-hidden pb-6 pt-3" data-testid="mobile-channel-list">
      <h1 className="sr-only">{t('listTitle')}</h1>
      <div className={M_PAGE_X}>
        <ChannelDiscoveryFilters
          compact
          query={d.query}
          onQuery={d.setQuery}
          country={d.country}
          onCountry={d.setCountry}
          field={d.field}
          onField={d.setField}
          sort={d.sort}
          onSort={d.setSort}
        />
      </div>
      <div className={`${M_PAGE_X} pt-3`}>
        {d.list.isLoading ? (
          <div className={`flex flex-col ${M_CARD_GAP}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[92px] animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : d.list.isError ? (
          <p className="py-6 text-center text-sm text-red-600">{t('listLoadFailed')}</p>
        ) : d.channels.length === 0 ? (
          <EmptyState message={d.filtered ? t('noResults') : t('listEmpty')} />
        ) : (
          <div className={`flex flex-col ${M_CARD_GAP}`}>
            {d.channels.map((c) => (
              <DiscoveryChannelRow key={c.userId} channel={c} />
            ))}
            {d.list.hasNextPage ? (
              <button
                type="button"
                onClick={() => d.list.fetchNextPage()}
                disabled={d.list.isFetchingNextPage}
                className="h-11 rounded-full border border-neutral-300 text-sm font-semibold disabled:opacity-50"
              >
                {t('loadMore')}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
