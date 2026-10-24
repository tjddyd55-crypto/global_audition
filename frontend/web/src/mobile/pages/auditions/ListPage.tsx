'use client'

import { Suspense, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import EmptyState from '@/components/ui/EmptyState'
import { publicPlatformApi } from '@/shared/api/publicPlatform'
import { AUDIENCE_FILTER_OPTIONS } from '@/shared/audition/audienceSelection'
import { RECRUIT_FIELD_CODES, toRecruitFieldCode } from '@/shared/audition/recruitFields'
import { useAudienceCountrySelection } from '@/shared/audition/useAudienceCountrySelection'
import type { AuditionDto } from '@/shared/types/audition'
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

const time = (v?: string | null) => (v ? new Date(v).getTime() || 0 : 0)

function MobileAuditionBrowse() {
  const t = useTranslations('auditions')
  const tCountry = useTranslations('country')
  const tField = useTranslations('recruitField')
  const params = useSearchParams()
  const { country, selectCountry } = useAudienceCountrySelection()
  const [field, setField] = useState(() => toRecruitFieldCode(params.get('category') ?? '') ?? '')
  const [recruitment, setRecruitment] = useState(params.get('recruitment') ?? 'OPEN')
  const [sort, setSort] = useState<Sort>('LATEST')
  const query = useQuery({
    queryKey: ['public-auditions', country, '', '', '', '', '', recruitment],
    queryFn: () => publicPlatformApi.browseAuditions({ recruitment, country }),
  })

  const auditions = useMemo(() => {
    const rows: AuditionDto[] = (query.data ?? []).filter(
      (a) => !field || (a.recruitFields ?? []).some((f) => toRecruitFieldCode(f) === field),
    )
    return [...rows].sort((a, b) =>
      sort === 'DEADLINE'
        ? (time(a.endDate || a.deadlineAt) || Infinity) - (time(b.endDate || b.deadlineAt) || Infinity)
        : time(b.createdAt || b.startDate) - time(a.createdAt || a.startDate),
    )
  }, [query.data, field, sort])

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
          <div className={`flex flex-col ${M_CARD_GAP}`}>
            {auditions.map((audition) => (
              <MobileAuditionRowCard key={audition.id} audition={audition} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
