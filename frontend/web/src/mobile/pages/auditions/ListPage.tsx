'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import EmptyState from '@/components/ui/EmptyState'
import { publicPlatformApi } from '@/shared/api/publicPlatform'
import { AUDIENCE_FILTER_OPTIONS } from '@/shared/audition/audienceSelection'
import { RECRUIT_FIELD_CODES, toRecruitFieldCode } from '@/shared/audition/recruitFields'
import { useAudienceCountrySelection } from '@/shared/audition/useAudienceCountrySelection'
import MobileAuditionRowCard from '../home/components/MobileAuditionRowCard'
import {
  M_CARD_GAP,
  M_CHIP_BASE,
  M_CHIP_OFF,
  M_CHIP_ON,
  M_FILTER_ROW,
  M_PAGE_X,
  M_SELECT,
  M_SELECT_ARROW,
} from '../../ui/mobileTokens'

type Sort = 'LATEST' | 'DEADLINE'

/** 모바일 오디션 목록: 2줄 필터(국가 칩 / 분야·상태·정렬) 바로 아래에 1열 카드. 검색 API는 그대로 사용. */
export default function MobileAuditionsListPage() {
  return (
    <Suspense fallback={null}>
      <MobileAuditionBrowse />
    </Suspense>
  )
}

const PAGE_SIZE = 10

function MobileAuditionBrowse() {
  const t = useTranslations('auditions')
  const tCountry = useTranslations('country')
  const tField = useTranslations('recruitField')
  const params = useSearchParams()
  const { country, selectCountry } = useAudienceCountrySelection()
  const [field, setField] = useState(() => toRecruitFieldCode(params.get('category') ?? '') ?? '')
  const [recruitment, setRecruitment] = useState(params.get('recruitment') ?? 'OPEN')
  const [sort, setSort] = useState<Sort>('LATEST')
  // 국가·분야·상태·정렬은 모두 서버 조건. 조건이 바뀌면 queryKey 가 바뀌어 0페이지부터 다시 조회한다.
  const query = useInfiniteQuery({
    queryKey: ['public-auditions-page', country, field, recruitment, sort, PAGE_SIZE],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      publicPlatformApi.browseAuditionsPage({
        recruitment,
        country,
        field: field || undefined,
        sort,
        page: pageParam,
        size: PAGE_SIZE,
      }),
    getNextPageParam: (last) => ((last.page + 1) * last.size < last.total ? last.page + 1 : undefined),
  })
  const auditions = query.data?.pages.flatMap((p) => p.items) ?? []
  const total = query.data?.pages[0]?.total ?? 0
  const sentinel = useRef<HTMLDivElement>(null)
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting) && !isFetchingNextPage) void fetchNextPage()
    }, { rootMargin: '200px' })
    io.observe(el)
    return () => io.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, auditions.length])

  return (
    <div className="w-full min-w-0 overflow-x-hidden pb-6 pt-3" data-testid="mobile-audition-list">
      <h1 className="sr-only">{t('listTitle')}</h1>
      <div className={M_FILTER_ROW} role="group" aria-label={t('country')} data-testid="mobile-country-chips">
        {AUDIENCE_FILTER_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={country === option}
            onClick={() => selectCountry(option)}
            className={`${M_CHIP_BASE} ${country === option ? M_CHIP_ON : M_CHIP_OFF}`}
          >
            {option === 'ALL' ? t('filterAll') : tCountry(option)}
          </button>
        ))}
      </div>
      <div className={`${M_FILTER_ROW} mt-2`} data-testid="mobile-list-options">
        <select
          className={M_SELECT}
          style={M_SELECT_ARROW}
          value={field}
          onChange={(e) => setField(e.target.value)}
          aria-label={t('category')}
        >
          <option value="">{t('allFields')}</option>
          {RECRUIT_FIELD_CODES.map((code) => (
            <option key={code} value={code}>
              {tField(code)}
            </option>
          ))}
        </select>
        <select
          className={M_SELECT}
          style={M_SELECT_ARROW}
          value={recruitment}
          onChange={(e) => setRecruitment(e.target.value)}
          aria-label={t('recruitment')}
        >
          <option value="OPEN">{t('statusOpen')}</option>
          <option value="ENDED">{t('statusClosed')}</option>
          <option value="ALL">{t('allStatuses')}</option>
        </select>
        <select
          className={M_SELECT}
          style={M_SELECT_ARROW}
          value={sort}
          onChange={(e) => setSort(e.target.value as Sort)}
          aria-label={t('sort')}
        >
          <option value="LATEST">{t('sortLatest')}</option>
          <option value="DEADLINE">{t('sortDeadline')}</option>
        </select>
      </div>

      <div className={`${M_PAGE_X} pt-3`}>
        {query.isLoading ? (
          <div className={`flex flex-col ${M_CARD_GAP}`}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-[124px] animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        ) : query.isError ? (
          <p className="py-6 text-center text-sm text-red-600">{t('loadFailed')}</p>
        ) : auditions.length === 0 ? (
          <EmptyState message={t('empty')} />
        ) : (
          <div className={`flex flex-col ${M_CARD_GAP}`} data-testid="mobile-audition-results" data-total={total}>
            {auditions.map((audition) => (
              <MobileAuditionRowCard key={audition.id} audition={audition} />
            ))}
            {hasNextPage ? (
              <div ref={sentinel} className="flex justify-center py-2">
                <button
                  type="button"
                  onClick={() => void fetchNextPage()}
                  disabled={isFetchingNextPage}
                  className="h-10 rounded-full border border-neutral-200 px-5 text-sm font-medium text-neutral-700"
                >
                  {isFetchingNextPage ? t('loadingMore') : t('loadMore')}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
