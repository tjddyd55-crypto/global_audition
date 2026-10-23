'use client'

import { Suspense, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n.config'
import { AuditionAudienceFilter } from './AuditionAudienceFilter'
import { useAudienceCountrySelection } from '@/shared/audition/useAudienceCountrySelection'
import AuditionListContent from './AuditionListContent'
import { publicPlatformApi } from '@/shared/api/publicPlatform'
import { INPUT_BASE } from '@/shared/ui/specClasses'

export default function AuditionList() {
  return (
    <Suspense fallback={null}>
      <AuditionBrowse />
    </Suspense>
  )
}

function AuditionBrowse() {
  const t = useTranslations('auditions')
  const params = useSearchParams()
  const { country, selectCountry } = useAudienceCountrySelection()
  const [category, setCategory] = useState(params.get('category') ?? '')
  const [agency, setAgency] = useState(params.get('agency') ?? '')
  const [text, setText] = useState(params.get('q') ?? '')
  const [from, setFrom] = useState(params.get('from') ?? '')
  const [to, setTo] = useState(params.get('to') ?? '')
  const [recruitment, setRecruitment] = useState(params.get('recruitment') ?? 'OPEN')
  const query = useQuery({
    queryKey: ['public-auditions', country, category, agency, text, from, to, recruitment],
    queryFn: () =>
      publicPlatformApi.browseAuditions({
        recruitment,
        country,
        category: category || undefined,
        agency: agency || undefined,
        q: text || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
  })

  return (
    <div className="min-w-0">
      <AuditionAudienceFilter country={country} onChange={selectCountry} />
      <form
        className="mb-4 grid gap-2 px-4 sm:grid-cols-3"
        onSubmit={(event) => {
          event.preventDefault()
          void query.refetch()
        }}
      >
        <input className={INPUT_BASE} value={text} onChange={(event) => setText(event.target.value)} placeholder={t('search')} />
        <input className={INPUT_BASE} value={category} onChange={(event) => setCategory(event.target.value)} placeholder={t('category')} />
        <input className={INPUT_BASE} value={agency} onChange={(event) => setAgency(event.target.value)} placeholder={t('agency')} />
        <input className={INPUT_BASE} type="date" value={from} onChange={(event) => setFrom(event.target.value)} aria-label={t('periodFrom')} />
        <input className={INPUT_BASE} type="date" value={to} onChange={(event) => setTo(event.target.value)} aria-label={t('periodTo')} />
        <select className={INPUT_BASE} value={recruitment} onChange={(event) => setRecruitment(event.target.value)} aria-label={t('recruitment')}>
          <option value="OPEN">{t('statusOpen')}</option>
          <option value="ENDED">{t('statusClosed')}</option>
          <option value="ALL">{t('filterAll')}</option>
        </select>
      </form>
      <AuditionListContent auditions={query.data} isLoading={query.isLoading} error={query.error} />
      <p className="px-4 pt-3 text-sm text-neutral-600">
        <Link href="/register" className="underline">
          {t('applyCta')}
        </Link>
      </p>
    </div>
  )
}
