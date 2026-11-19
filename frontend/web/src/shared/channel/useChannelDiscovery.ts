'use client'

import { useEffect, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { channelApi, type ChannelListSort } from '@/shared/api/channel'
import type { AudienceFilterOption } from '@/shared/audition/audienceSelection'
import { CHANNEL_PAGE_SIZE, type ChannelFieldFilter } from './discovery'

/** PC·모바일 채널 목록 공통 상태. 검색어는 300ms 디바운스, 나머지는 즉시 서버 조건. */
export function useChannelDiscovery() {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [country, setCountry] = useState<AudienceFilterOption>('ALL')
  const [field, setField] = useState<ChannelFieldFilter>('ALL')
  const [sort, setSort] = useState<ChannelListSort>('NEWEST')

  useEffect(() => {
    const id = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(id)
  }, [query])

  const list = useInfiniteQuery({
    queryKey: ['channels-public', debounced, country, field, sort],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      channelApi.listPublic({
        q: debounced || undefined,
        country,
        field,
        sort,
        limit: CHANNEL_PAGE_SIZE,
        offset: pageParam,
      }),
    getNextPageParam: (last, pages) =>
      last.length < CHANNEL_PAGE_SIZE ? undefined : pages.reduce((n, p) => n + p.length, 0),
  })

  const channels = list.data?.pages.flat() ?? []
  const filtered = debounced !== '' || country !== 'ALL' || field !== 'ALL'
  return { query, setQuery, country, setCountry, field, setField, sort, setSort, list, channels, filtered }
}
