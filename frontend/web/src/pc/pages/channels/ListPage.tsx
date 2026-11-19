'use client'

import { useTranslations } from 'next-intl'
import EmptyState from '@/components/ui/EmptyState'
import { ChannelDiscoveryFilters } from '@/components/channel/ChannelDiscoveryFilters'
import { DiscoveryChannelCard } from '@/components/channel/DiscoveryChannelCard'
import { useChannelDiscovery } from '@/shared/channel/useChannelDiscovery'

export default function PcChannelsListPage() {
  const t = useTranslations('channel')
  const d = useChannelDiscovery()
  return (
    <div className="mx-auto w-full max-w-[1200px] px-4 pb-20 pt-16 md:px-6">
      <div className="mb-6">
        <h1 className="mb-2 text-[28px] font-bold">{t('listTitle')}</h1>
        <p className="text-base text-neutral-600">{t('listHint')}</p>
      </div>
      <div className="mb-6">
        <ChannelDiscoveryFilters
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
      {d.list.isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-neutral-100" />
          ))}
        </div>
      ) : d.list.isError ? (
        <p className="text-center text-sm text-red-600">{t('listLoadFailed')}</p>
      ) : d.channels.length === 0 ? (
        <EmptyState message={d.filtered ? t('noResults') : t('listEmpty')} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" data-testid="channel-grid">
            {d.channels.map((c) => (
              <DiscoveryChannelCard key={c.userId} channel={c} />
            ))}
          </div>
          {d.list.hasNextPage ? (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={() => d.list.fetchNextPage()}
                disabled={d.list.isFetchingNextPage}
                className="h-11 rounded-full border border-neutral-300 px-6 text-sm font-semibold disabled:opacity-50"
              >
                {t('loadMore')}
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
